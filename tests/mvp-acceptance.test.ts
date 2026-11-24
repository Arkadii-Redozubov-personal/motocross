import { beforeEach, describe, expect, it } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { openDatabase, all, one } from "@/server/db/client";
import { seedIfEmpty } from "@/server/db/seed";
import { calendarMonth, quote, resolveDay, slotsFor } from "@/server/services/availability";
import { cancelBooking, confirmBooking, createBooking, listBookings, rejectBooking } from "@/server/services/bookings";
import { changePassword, createSessionToken, login, sameOrigin, verifySessionToken } from "@/server/services/auth";
import { rateLimit, resetRateLimits } from "@/server/services/util";
import { bookingInput } from "@/shared/lib/validation";
import { utcIsoToWarsaw, warsawToUtcIso, weekdayOf } from "@/shared/lib/time";

// Tuesday 2026-12-01 09:00 Europe/Warsaw
const NOW = Date.parse("2026-12-01T08:00:00Z");
let db: DatabaseSync;
let wro: number;
let poz: number;
let startModel: number; // 1 unit, beginner
let eco: number; // 3 units
let seg: number; // 3 quads

const base = (over: Record<string, unknown> = {}) =>
  bookingInput.parse({
    locationId: wro, date: "2026-12-02", startTime: "10:00", durationMin: 120, modelId: startModel, qty: 1,
    name: "Jan Kowalski", phone: "+48 600 100 200", consent: true, idempotencyKey: `key-${Math.random().toString(36).slice(2)}-xx`,
    ...over,
  });

beforeEach(() => {
  resetRateLimits();
  db = openDatabase(":memory:");
  seedIfEmpty(db);
  wro = one<{ id: number }>(db, "SELECT id FROM locations WHERE slug='wroclaw'")!.id;
  poz = one<{ id: number }>(db, "SELECT id FROM locations WHERE slug='poznan'")!.id;
  startModel = one<{ id: number }>(db, "SELECT id FROM vehicle_models WHERE slug='enduro-300-start'")!.id;
  eco = one<{ id: number }>(db, "SELECT id FROM vehicle_models WHERE slug='enduro-250'")!.id;
  seg = one<{ id: number }>(db, "SELECT id FROM vehicle_models WHERE slug='segway-at5l'")!.id;
});

const mk = (over: Record<string, unknown> = {}) => {
  const r = createBooking(db, base(over), NOW);
  if (!r.ok) throw new Error("create failed " + r.code);
  return r.booking;
};

describe("timezone (Europe/Warsaw <-> UTC, DST)", () => {
  it("handles CET and CEST", () => {
    expect(warsawToUtcIso("2026-01-15", "09:00")).toBe("2026-01-15T08:00:00.000Z");
    expect(warsawToUtcIso("2026-07-15", "09:00")).toBe("2026-07-15T07:00:00.000Z");
  });
  it("handles DST switch days", () => {
    expect(warsawToUtcIso("2026-03-28", "09:00")).toBe("2026-03-28T08:00:00.000Z");
    expect(warsawToUtcIso("2026-03-29", "09:00")).toBe("2026-03-29T07:00:00.000Z");
    expect(warsawToUtcIso("2026-10-24", "09:00")).toBe("2026-10-24T07:00:00.000Z");
    expect(warsawToUtcIso("2026-10-25", "09:00")).toBe("2026-10-25T08:00:00.000Z");
  });
  it("round-trips", () => {
    expect(utcIsoToWarsaw("2026-07-15T07:00:00.000Z")).toEqual({ ymd: "2026-07-15", hm: "09:00" });
    expect(weekdayOf("2026-12-05")).toBe(6);
  });
});

describe("AC-01/02 schedule, location and pricing", () => {
  it("Wroclaw on weekdays and Sunday, Poznan on Saturday", () => {
    expect(resolveDay(db, "2026-12-02").map((d) => d.slug)).toEqual(["wroclaw"]);
    expect(resolveDay(db, "2026-12-05").map((d) => d.slug)).toEqual(["poznan"]);
    expect(resolveDay(db, "2026-12-06").map((d) => d.slug)).toEqual(["wroclaw"]);
  });
  it("closed date cannot be booked; exceptions close a date", () => {
    expect(createBooking(db, base({ locationId: poz }), NOW)).toMatchObject({ ok: false, code: "CLOSED_DATE" });
    db.prepare("INSERT INTO schedule_exceptions (location_id, date_ymd, is_open, note) VALUES (?, '2026-12-03', 0, 'holiday')").run(wro);
    expect(createBooking(db, base({ date: "2026-12-03" }), NOW)).toMatchObject({ ok: false, code: "CLOSED_DATE" });
    const cal = calendarMonth(db, "2026-12", NOW);
    expect(cal.find((d) => d.date === "2026-12-03")!.open).toBe(false);
    expect(cal.find((d) => d.date === "2026-12-05")).toMatchObject({ open: true, slug: "poznan" });
    expect(cal.find((d) => d.date === "2026-11-30" || d.date === "2026-12-01")!.open).toBeDefined();
  });
  it("server computes price (hourly rates, per-hour add-ons)", () => {
    expect(quote(db, { modelId: eco, durationMin: 120, qty: 2, addons: ["instructor", "gopro"] })).toMatchObject({ subtotal: 600, total: 600 + 200 + 30 });
    expect(quote(db, { modelId: eco, durationMin: 45, qty: 1, addons: [] })).toBeNull();
  });
  it("fleet quotas match the spec: 4 quads, 7 motorcycles, one beginner model", () => {
    const n = (cat: string) => one<{ c: number }>(db, "SELECT COUNT(*) c FROM assets a JOIN vehicle_models m ON m.id=a.model_id WHERE m.category=?", cat)!.c;
    expect(n("quad")).toBe(4);
    expect(n("moto")).toBe(7);
    expect(all(db, "SELECT id FROM vehicle_models WHERE beginner_flag = 1")).toHaveLength(1);
  });
  it("rejects unaligned, out-of-hours and past slots", () => {
    expect(createBooking(db, base({ startTime: "10:30" }), NOW)).toMatchObject({ ok: false, code: "INVALID_SLOT" });
    expect(createBooking(db, base({ startTime: "17:00", durationMin: 120 }), NOW)).toMatchObject({ ok: false, code: "INVALID_SLOT" });
    expect(createBooking(db, base({ date: "2026-12-01", startTime: "09:00" }), NOW)).toMatchObject({ ok: false, code: "PAST_SLOT" });
  });
});

describe("AC-03 request creation", () => {
  it("creates one NEW booking with snapshot price and reference", () => {
    const b = mk();
    expect(b.status).toBe("NEW");
    expect(b.referenceCode).toMatch(/^MQ-/);
    expect(one<{ unit_price_snapshot_pln: number }>(db, "SELECT unit_price_snapshot_pln FROM booking_items WHERE booking_id = ?", b.id)!.unit_price_snapshot_pln).toBe(500);
    // changing the price later does not touch history
    db.prepare("UPDATE rates SET amount_pln = 999 WHERE model_id = ?").run(startModel);
    expect(listBookings(db)[0].items[0].unit).toBe(500);
  });
  it("is idempotent for repeated submissions", () => {
    const input = base();
    const a = createBooking(db, input, NOW);
    const b = createBooking(db, input, NOW);
    expect(a.ok && b.ok && a.booking.id === b.booking.id && b.duplicate).toBe(true);
    expect(all(db, "SELECT id FROM bookings")).toHaveLength(1);
  });
  it("validation: missing required fields / no consent / honeypot are rejected", () => {
    expect(bookingInput.safeParse({ ...base(), name: "" }).success).toBe(false);
    expect(bookingInput.safeParse({ ...base(), phone: "abc" }).success).toBe(false);
    expect(bookingInput.safeParse({ ...base(), consent: false }).success).toBe(false);
    expect(bookingInput.safeParse({ ...base(), website: "spam" }).success).toBe(false);
  });
  it("does not allow more units than exist", () => {
    expect(createBooking(db, base({ qty: 2 }), NOW)).toMatchObject({ ok: false, code: "TOO_MANY_UNITS" });
  });
});

describe("AC-04/05 availability and confirmation", () => {
  it("NEW does not block, CONFIRMED blocks, CANCELLED restores", () => {
    const free = () => slotsFor(db, { ymd: "2026-12-02", locationId: wro, modelId: startModel, durationMin: 120, qty: 1 }, NOW)!.slots.find((s) => s.hm === "10:00")!;
    const b = mk();
    expect(free().available).toBe(true);
    expect(confirmBooking(db, b.id, "t@t")).toEqual({ ok: true, status: "CONFIRMED" });
    expect(free().available).toBe(false);
    expect(cancelBooking(db, b.id, "t@t")).toEqual({ ok: true, status: "CANCELLED" });
    expect(free().available).toBe(true);
    expect(all(db, "SELECT id FROM booking_allocations")).toHaveLength(0);
  });
  it("two overlapping requests for one asset: at most one can be confirmed", () => {
    const a = mk();
    const b = mk({ startTime: "11:00" });
    expect(confirmBooking(db, a.id, "t@t").ok).toBe(true);
    const r = confirmBooking(db, b.id, "t@t");
    expect(r).toMatchObject({ ok: false, code: "SLOT_CONFLICT", conflicts: [a.referenceCode] });
    expect(one<{ status: string }>(db, "SELECT status FROM bookings WHERE id = ?", b.id)!.status).toBe("NEW");
    // double-confirming the same booking is refused
    expect(confirmBooking(db, a.id, "t@t")).toMatchObject({ ok: false, code: "INVALID_STATE" });
  });
  it("[start, end) allows back-to-back rides", () => {
    const a = mk({ startTime: "10:00" });
    const b = mk({ startTime: "12:00" });
    expect(confirmBooking(db, a.id, "t@t").ok).toBe(true);
    expect(confirmBooking(db, b.id, "t@t").ok).toBe(true);
  });
  it("database trigger forbids overlapping allocations on one asset", () => {
    const a = mk();
    confirmBooking(db, a.id, "t@t");
    const asset = one<{ asset_id: number }>(db, "SELECT asset_id FROM booking_allocations LIMIT 1")!.asset_id;
    expect(() =>
      db.prepare("INSERT INTO booking_allocations (booking_id, asset_id, starts_at_utc, ends_at_utc) VALUES (?,?,?,?)")
        .run(a.id, asset, "2026-12-02T09:30:00.000Z", "2026-12-02T10:30:00.000Z")).toThrow(/ASSET_OVERLAP/);
  });
  it("multiple units: allocations pick distinct assets", () => {
    const a = mk({ modelId: eco, qty: 2 });
    confirmBooking(db, a.id, "t@t");
    const ids = all<{ asset_id: number }>(db, "SELECT asset_id FROM booking_allocations").map((x) => x.asset_id);
    expect(new Set(ids).size).toBe(2);
    const r = slotsFor(db, { ymd: "2026-12-02", locationId: wro, modelId: eco, durationMin: 120, qty: 1 }, NOW)!.slots.find((s) => s.hm === "10:00")!;
    expect(r.free).toBe(1);
  });
  it("reject and invalid transitions", () => {
    const a = mk();
    expect(rejectBooking(db, a.id, "t@t")).toEqual({ ok: true, status: "REJECTED" });
    expect(confirmBooking(db, a.id, "t@t")).toMatchObject({ ok: false, code: "INVALID_STATE" });
    expect(cancelBooking(db, a.id, "t@t")).toMatchObject({ ok: false, code: "INVALID_STATE" });
  });
  it("quads and motorcycles are independent inventories", () => {
    mk({ modelId: seg, qty: 3 });
    const q = mk({ modelId: seg, qty: 3 });
    expect(confirmBooking(db, q.id, "t@t").ok).toBe(true);
    const s = slotsFor(db, { ymd: "2026-12-02", locationId: wro, modelId: startModel, durationMin: 120, qty: 1 }, NOW)!.slots.find((x) => x.hm === "10:00")!;
    expect(s.available).toBe(true);
  });
});

describe("AC-07 auth", () => {
  it("login, session token, tampering and expiry", () => {
    expect(login(db, "admin@motoquad.pl", "wrong")).toEqual({ ok: false });
    const r = login(db, "admin@motoquad.pl", "MotoQuad2026!");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(verifySessionToken(db, r.token)).toBe("admin@motoquad.pl");
    expect(verifySessionToken(db, r.token + "x")).toBeNull();
    expect(verifySessionToken(db, undefined)).toBeNull();
    expect(verifySessionToken(db, createSessionToken(db, "admin@motoquad.pl", 0), Date.now())).toBeNull();
  });
  it("password change", () => {
    expect(changePassword(db, "admin@motoquad.pl", "bad", "NewPassword123")).toBe(false);
    expect(changePassword(db, "admin@motoquad.pl", "MotoQuad2026!", "NewPassword123")).toBe(true);
    expect(login(db, "admin@motoquad.pl", "NewPassword123")).toMatchObject({ ok: true, mustChange: false });
  });
  it("CSRF origin check and rate limit", () => {
    const mkReq = (origin?: string) => new Request("http://x/api", { method: "POST", headers: { host: "site.test", ...(origin ? { origin } : {}) } });
    expect(sameOrigin(mkReq("http://site.test"))).toBe(true);
    expect(sameOrigin(mkReq("http://evil.test"))).toBe(false);
    expect(sameOrigin(mkReq())).toBe(false);
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 1000, 1)).toBe(true);
    expect(rateLimit("k", 3, 1000, 2)).toBe(false);
  });
});

