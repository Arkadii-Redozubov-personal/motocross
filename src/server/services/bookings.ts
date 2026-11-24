import type { DatabaseSync } from "node:sqlite";
import { all, one, run } from "../db/client";
import { eligibleAssetIds, freeAssetIds, quote, resolveDay } from "./availability";
import { getSetting } from "./settings";
import { writeAudit } from "./audit";
import { referenceCode } from "./util";
import type { BookingInput } from "@/shared/lib/validation";
import { hmToMinutes, isValidYmd, utcIsoToWarsaw, warsawToUtcMs } from "@/shared/lib/time";

export type CreateResult =
  | { ok: true; duplicate: boolean; booking: { id: number; referenceCode: string; status: string; total: number; startsAtUtc: string; endsAtUtc: string } }
  | { ok: false; code: "CLOSED_DATE" | "INVALID_SLOT" | "PAST_SLOT" | "UNKNOWN_MODEL" | "INVALID_PRICE" | "TOO_MANY_UNITS" | "SLOT_TAKEN"; status: number };

export function createBooking(db: DatabaseSync, input: BookingInput, nowMs = Date.now()): CreateResult {
  const dup = one<{ id: number; reference_code: string; status: string; total_amount_pln: number; starts_at_utc: string; ends_at_utc: string }>(
    db, "SELECT id, reference_code, status, total_amount_pln, starts_at_utc, ends_at_utc FROM bookings WHERE idempotency_key = ?", input.idempotencyKey);
  if (dup) {
    return { ok: true, duplicate: true, booking: { id: dup.id, referenceCode: dup.reference_code, status: dup.status, total: dup.total_amount_pln, startsAtUtc: dup.starts_at_utc, endsAtUtc: dup.ends_at_utc } };
  }
  if (!isValidYmd(input.date)) return { ok: false, code: "CLOSED_DATE", status: 422 };
  const day = resolveDay(db, input.date).find((d) => d.locationId === input.locationId);
  if (!day) return { ok: false, code: "CLOSED_DATE", status: 422 };

  const s = getSetting(db, "booking");
  const startMin = hmToMinutes(input.startTime);
  const openMin = hmToMinutes(day.open);
  const closeMin = hmToMinutes(day.close);
  if (startMin < openMin || startMin + input.durationMin > closeMin || (startMin - openMin) % s.slotStepMin !== 0) {
    return { ok: false, code: "INVALID_SLOT", status: 422 };
  }
  const startMs = warsawToUtcMs(input.date, input.startTime);
  if (startMs < nowMs + s.minLeadMin * 60_000) return { ok: false, code: "PAST_SLOT", status: 422 };

  const model = one<{ id: number; title_pl: string }>(db, "SELECT id, title_pl FROM vehicle_models WHERE id = ? AND published = 1", input.modelId);
  if (!model) return { ok: false, code: "UNKNOWN_MODEL", status: 422 };
  const q = quote(db, { modelId: model.id, durationMin: input.durationMin, qty: input.qty, addons: input.addons });
  if (!q) return { ok: false, code: "INVALID_PRICE", status: 422 };

  const startIso = new Date(startMs).toISOString();
  const endIso = new Date(startMs + input.durationMin * 60_000).toISOString();
  if (eligibleAssetIds(db, model.id, input.locationId).length < input.qty) return { ok: false, code: "TOO_MANY_UNITS", status: 409 };
  if (freeAssetIds(db, model.id, input.locationId, startIso, endIso).length < input.qty) return { ok: false, code: "SLOT_TAKEN", status: 409 };

  const ref = referenceCode();
  const createdAt = new Date(nowMs).toISOString();
  db.exec("BEGIN IMMEDIATE");
  try {
    const r = run(db,
      `INSERT INTO bookings (reference_code, location_id, starts_at_utc, ends_at_utc, duration_min, status, customer_name, customer_phone, customer_email, comment,
         addons_json, total_amount_pln, currency, idempotency_key, lang, consent_at_utc, utm_json, created_at_utc)
       VALUES (?,?,?,?,?,'NEW',?,?,?,?,?,?, 'PLN', ?,?,?,?,?)`,
      ref, input.locationId, startIso, endIso, input.durationMin, input.name, input.phone, input.email || null, input.comment ?? "",
      JSON.stringify(q.addons), q.total, input.idempotencyKey, input.lang, createdAt, input.utm ? JSON.stringify(input.utm) : null, createdAt);
    const id = Number(r.lastInsertRowid);
    run(db, "INSERT INTO booking_items (booking_id, model_id, qty, unit_price_snapshot_pln, model_title_snapshot) VALUES (?,?,?,?,?)", id, model.id, input.qty, q.unit, model.title_pl);
    db.exec("COMMIT");
    return { ok: true, duplicate: false, booking: { id, referenceCode: ref, status: "NEW", total: q.total, startsAtUtc: startIso, endsAtUtc: endIso } };
  } catch (e) {
    db.exec("ROLLBACK");
    if (String((e as Error).message).includes("UNIQUE") && String((e as Error).message).includes("idempotency")) {
      const again = one<{ id: number; reference_code: string; status: string; total_amount_pln: number; starts_at_utc: string; ends_at_utc: string }>(
        db, "SELECT id, reference_code, status, total_amount_pln, starts_at_utc, ends_at_utc FROM bookings WHERE idempotency_key = ?", input.idempotencyKey);
      if (again) return { ok: true, duplicate: true, booking: { id: again.id, referenceCode: again.reference_code, status: again.status, total: again.total_amount_pln, startsAtUtc: again.starts_at_utc, endsAtUtc: again.ends_at_utc } };
    }
    throw e;
  }
}

export type TransitionResult =
  | { ok: true; status: string }
  | { ok: false; code: "NOT_FOUND" | "INVALID_STATE" | "SLOT_CONFLICT"; conflicts?: string[] };

export function confirmBooking(db: DatabaseSync, id: number, adminEmail: string): TransitionResult {
  db.exec("BEGIN IMMEDIATE");
  try {
    const b = one<{ id: number; status: string; location_id: number; starts_at_utc: string; ends_at_utc: string }>(
      db, "SELECT id, status, location_id, starts_at_utc, ends_at_utc FROM bookings WHERE id = ?", id);
    if (!b) { db.exec("ROLLBACK"); return { ok: false, code: "NOT_FOUND" }; }
    if (b.status !== "NEW") { db.exec("ROLLBACK"); return { ok: false, code: "INVALID_STATE" }; }
    const items = all<{ model_id: number; qty: number }>(db, "SELECT model_id, qty FROM booking_items WHERE booking_id = ?", id);
    const picked: number[] = [];
    for (const it of items) {
      const free = freeAssetIds(db, it.model_id, b.location_id, b.starts_at_utc, b.ends_at_utc).filter((a) => !picked.includes(a));
      if (free.length < it.qty) {
        const conflicts = all<{ reference_code: string }>(db,
          `SELECT DISTINCT b2.reference_code FROM bookings b2 JOIN booking_items i ON i.booking_id = b2.id
           WHERE b2.status = 'CONFIRMED' AND b2.location_id = ? AND i.model_id = ? AND b2.starts_at_utc < ? AND b2.ends_at_utc > ?`,
          b.location_id, it.model_id, b.ends_at_utc, b.starts_at_utc).map((r) => r.reference_code);
        db.exec("ROLLBACK");
        return { ok: false, code: "SLOT_CONFLICT", conflicts };
      }
      picked.push(...free.slice(0, it.qty));
    }
    for (const assetId of picked) {
      run(db, "INSERT INTO booking_allocations (booking_id, asset_id, starts_at_utc, ends_at_utc) VALUES (?,?,?,?)", id, assetId, b.starts_at_utc, b.ends_at_utc);
    }
    run(db, "UPDATE bookings SET status = 'CONFIRMED', decided_at_utc = ? WHERE id = ?", new Date().toISOString(), id);
    writeAudit(db, adminEmail, "booking.confirm", "booking", String(id), { assets: picked.length });
    db.exec("COMMIT");
    return { ok: true, status: "CONFIRMED" };
  } catch (e) {
    try { db.exec("ROLLBACK"); } catch { /* already rolled back */ }
    if (String((e as Error).message).includes("ASSET_OVERLAP")) return { ok: false, code: "SLOT_CONFLICT" };
    throw e;
  }
}

export function rejectBooking(db: DatabaseSync, id: number, adminEmail: string): TransitionResult {
  const b = one<{ status: string }>(db, "SELECT status FROM bookings WHERE id = ?", id);
  if (!b) return { ok: false, code: "NOT_FOUND" };
  if (b.status !== "NEW") return { ok: false, code: "INVALID_STATE" };
  run(db, "UPDATE bookings SET status = 'REJECTED', decided_at_utc = ? WHERE id = ?", new Date().toISOString(), id);
  writeAudit(db, adminEmail, "booking.reject", "booking", String(id));
  return { ok: true, status: "REJECTED" };
}

export function cancelBooking(db: DatabaseSync, id: number, adminEmail: string): TransitionResult {
  db.exec("BEGIN IMMEDIATE");
  try {
    const b = one<{ status: string }>(db, "SELECT status FROM bookings WHERE id = ?", id);
    if (!b) { db.exec("ROLLBACK"); return { ok: false, code: "NOT_FOUND" }; }
    if (b.status !== "CONFIRMED") { db.exec("ROLLBACK"); return { ok: false, code: "INVALID_STATE" }; }
    run(db, "DELETE FROM booking_allocations WHERE booking_id = ?", id);
    run(db, "UPDATE bookings SET status = 'CANCELLED', decided_at_utc = ? WHERE id = ?", new Date().toISOString(), id);
    writeAudit(db, adminEmail, "booking.cancel", "booking", String(id));
    db.exec("COMMIT");
    return { ok: true, status: "CANCELLED" };
  } catch (e) {
    try { db.exec("ROLLBACK"); } catch { /* noop */ }
    throw e;
  }
}

export type BookingView = {
  id: number; referenceCode: string; status: string; startsAtUtc: string; endsAtUtc: string; date: string; startTime: string; endTime: string;
  durationMin: number; city: string; locationId: number; customerName: string; customerPhone: string; customerEmail: string | null; comment: string;
  total: number; addons: { slug: string; amount: number }[]; items: { modelId: number; title: string; qty: number; unit: number }[];
  notificationStatus: string; notificationError: string | null; createdAtUtc: string; lang: string;
};

export function listBookings(db: DatabaseSync, f: { status?: string; date?: string; locationId?: number; modelId?: number; q?: string } = {}): BookingView[] {
  const where: string[] = [];
  const p: unknown[] = [];
  if (f.status) { where.push("b.status = ?"); p.push(f.status); }
  if (f.locationId) { where.push("b.location_id = ?"); p.push(f.locationId); }
  if (f.date) {
    where.push("b.starts_at_utc >= ? AND b.starts_at_utc < ?");
    p.push(new Date(warsawToUtcMs(f.date, "00:00")).toISOString(), new Date(warsawToUtcMs(f.date, "00:00") + 36 * 3600_000).toISOString());
  }
  if (f.modelId) { where.push("EXISTS (SELECT 1 FROM booking_items i WHERE i.booking_id = b.id AND i.model_id = ?)"); p.push(f.modelId); }
  if (f.q) { where.push("(b.customer_name LIKE ? OR b.customer_phone LIKE ? OR b.reference_code LIKE ?)"); const like = `%${f.q}%`; p.push(like, like, like); }
  const rows = all<Record<string, unknown>>(db,
    `SELECT b.*, l.city_pl FROM bookings b JOIN locations l ON l.id = b.location_id
     ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY b.created_at_utc DESC LIMIT 300`, ...p);
  return rows.map((r) => {
    const start = utcIsoToWarsaw(String(r.starts_at_utc));
    const end = utcIsoToWarsaw(String(r.ends_at_utc));
    const items = all<{ model_id: number; qty: number; unit_price_snapshot_pln: number; model_title_snapshot: string }>(
      db, "SELECT model_id, qty, unit_price_snapshot_pln, model_title_snapshot FROM booking_items WHERE booking_id = ?", r.id).map((i) => ({
      modelId: i.model_id, title: i.model_title_snapshot, qty: i.qty, unit: i.unit_price_snapshot_pln }));
    return {
      id: Number(r.id), referenceCode: String(r.reference_code), status: String(r.status),
      startsAtUtc: String(r.starts_at_utc), endsAtUtc: String(r.ends_at_utc), date: start.ymd, startTime: start.hm, endTime: end.hm,
      durationMin: Number(r.duration_min), city: String(r.city_pl), locationId: Number(r.location_id),
      customerName: String(r.customer_name), customerPhone: String(r.customer_phone), customerEmail: (r.customer_email as string | null) ?? null,
      comment: String(r.comment ?? ""), total: Number(r.total_amount_pln), addons: JSON.parse(String(r.addons_json)), items,
      notificationStatus: String(r.notification_status), notificationError: (r.notification_error as string | null) ?? null,
      createdAtUtc: String(r.created_at_utc), lang: String(r.lang),
    };
  });
}

