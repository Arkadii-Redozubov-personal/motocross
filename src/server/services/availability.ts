import type { DatabaseSync } from "node:sqlite";
import { all, one } from "../db/client";
import { getSetting } from "./settings";
import {
  addDaysYmd, hmToMinutes, isValidYmd, minutesToHm, todayWarsawYmd, warsawToUtcMs, weekdayOf,
} from "@/shared/lib/time";

export type OpenDay = { locationId: number; slug: string; open: string; close: string; note: string };

/** Which locations work on a given date (exceptions override weekly schedule). */
export function resolveDay(db: DatabaseSync, ymd: string): OpenDay[] {
  const wd = weekdayOf(ymd);
  const locs = all<{ id: number; slug: string }>(db, "SELECT id, slug FROM locations WHERE active = 1 ORDER BY id");
  const out: OpenDay[] = [];
  for (const l of locs) {
    const ex = one<{ is_open: number; open_time: string; close_time: string; note: string }>(
      db, "SELECT is_open, open_time, close_time, note FROM schedule_exceptions WHERE location_id = ? AND date_ymd = ?", l.id, ymd);
    const sc = ex ?? one<{ is_open: number; open_time: string; close_time: string; note?: string }>(
      db, "SELECT is_open, open_time, close_time FROM schedules WHERE location_id = ? AND weekday = ?", l.id, wd);
    if (sc && sc.is_open === 1) {
      out.push({ locationId: l.id, slug: l.slug, open: sc.open_time, close: sc.close_time, note: sc.note ?? "" });
    }
  }
  return out;
}

export type CalendarDay = { date: string; open: boolean; locationId: number | null; slug: string | null };

export function calendarMonth(db: DatabaseSync, ym: string, nowMs = Date.now()): CalendarDay[] {
  const [y, m] = ym.split("-").map(Number);
  const settings = getSetting(db, "booking");
  const today = todayWarsawYmd(nowMs);
  const last = addDaysYmd(today, settings.horizonDays);
  const days: CalendarDay[] = [];
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  for (let d = 1; d <= count; d++) {
    const date = `${ym}-${String(d).padStart(2, "0")}`;
    let open = date >= today && date <= last;
    let loc: OpenDay | undefined;
    if (open) {
      loc = resolveDay(db, date).find((x) => hasFutureSlot(db, date, x, nowMs));
      open = !!loc;
    }
    days.push({ date, open, locationId: loc?.locationId ?? null, slug: loc?.slug ?? null });
  }
  return days;
}

function hasFutureSlot(db: DatabaseSync, ymd: string, day: OpenDay, nowMs: number): boolean {
  const s = getSetting(db, "booking");
  const endMs = warsawToUtcMs(ymd, day.close);
  return endMs - 60 * 60_000 >= nowMs + s.minLeadMin * 60_000;
}

export function eligibleAssetIds(db: DatabaseSync, modelId: number, locationId: number): number[] {
  return all<{ id: number }>(db,
    "SELECT id FROM assets WHERE model_id = ? AND active = 1 AND (location_id IS NULL OR location_id = ?) ORDER BY code", modelId, locationId).map((r) => r.id);
}

/** Assets of the model free on [startIso, endIso). Only confirmed bookings own allocations. */
export function freeAssetIds(db: DatabaseSync, modelId: number, locationId: number, startIso: string, endIso: string): number[] {
  const busy = new Set(
    all<{ asset_id: number }>(db,
      `SELECT DISTINCT ba.asset_id FROM booking_allocations ba JOIN bookings b ON b.id = ba.booking_id
       WHERE b.status = 'CONFIRMED' AND ba.starts_at_utc < ? AND ba.ends_at_utc > ?`, endIso, startIso).map((r) => r.asset_id));
  return eligibleAssetIds(db, modelId, locationId).filter((id) => !busy.has(id));
}

export type Slot = { hm: string; startUtc: string; available: boolean; free: number };

export function slotsFor(
  db: DatabaseSync,
  p: { ymd: string; locationId: number; modelId: number; durationMin: number; qty: number },
  nowMs = Date.now(),
): { open: string; close: string; eligible: number; slots: Slot[] } | null {
  if (!isValidYmd(p.ymd)) return null;
  const day = resolveDay(db, p.ymd).find((d) => d.locationId === p.locationId);
  if (!day) return null;
  const s = getSetting(db, "booking");
  const eligible = eligibleAssetIds(db, p.modelId, p.locationId).length;
  const slots: Slot[] = [];
  const openMin = hmToMinutes(day.open);
  const closeMin = hmToMinutes(day.close);
  for (let t = openMin; t + p.durationMin <= closeMin; t += s.slotStepMin) {
    const hm = minutesToHm(t);
    const startMs = warsawToUtcMs(p.ymd, hm);
    const startUtc = new Date(startMs).toISOString();
    const endUtc = new Date(startMs + p.durationMin * 60_000).toISOString();
    const future = startMs >= nowMs + s.minLeadMin * 60_000;
    const free = future ? freeAssetIds(db, p.modelId, p.locationId, startUtc, endUtc).length : 0;
    slots.push({ hm, startUtc, free, available: future && free >= p.qty });
  }
  return { open: day.open, close: day.close, eligible, slots };
}

export type Quote = {
  unit: number;
  subtotal: number;
  addons: { slug: string; amount: number }[];
  total: number;
  currency: "PLN";
};

/** Server-side price calculation. Returns null if there is no rate for the duration. */
export function quote(
  db: DatabaseSync,
  p: { modelId: number; durationMin: number; qty: number; addons: string[] },
): Quote | null {
  const rate = one<{ amount_pln: number }>(db, "SELECT amount_pln FROM rates WHERE model_id = ? AND duration_min = ?", p.modelId, p.durationMin);
  if (!rate) return null;
  const addons: Quote["addons"] = [];
  for (const slug of new Set(p.addons)) {
    const a = one<{ pricing_mode: string; amount_pln: number }>(db, "SELECT pricing_mode, amount_pln FROM addons WHERE slug = ? AND active = 1", slug);
    if (!a) return null;
    addons.push({ slug, amount: a.pricing_mode === "per_hour" ? Math.round((a.amount_pln * p.durationMin) / 60) : a.amount_pln });
  }
  const subtotal = rate.amount_pln * p.qty;
  return { unit: rate.amount_pln, subtotal, addons, total: subtotal + addons.reduce((s, a) => s + a.amount, 0), currency: "PLN" };
}

