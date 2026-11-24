import { getDb } from "@/server/db/client";
import { calendarMonth, quote, slotsFor } from "@/server/services/availability";
import { err, json } from "@/server/http";
import { isValidYmd } from "@/shared/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const db = getDb();
  const u = new URL(req.url).searchParams;

  const month = u.get("month");
  if (month) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return err("BAD_REQUEST", 400);
    return json({ month, days: calendarMonth(db, month) });
  }

  const date = u.get("date") ?? "";
  const locationId = Number(u.get("locationId"));
  const modelId = Number(u.get("modelId"));
  const durationMin = Number(u.get("durationMin"));
  const qty = Number(u.get("qty") ?? 1);
  const addons = (u.get("addons") ?? "").split(",").filter(Boolean);
  if (!isValidYmd(date) || !Number.isInteger(locationId) || !Number.isInteger(modelId) || !Number.isInteger(durationMin) || !Number.isInteger(qty) || qty < 1 || qty > 20) {
    return err("BAD_REQUEST", 400);
  }
  const slots = slotsFor(db, { ymd: date, locationId, modelId, durationMin, qty });
  if (!slots) return json({ ok: true, slots: [], eligible: 0, quote: null });
  return json({ ok: true, openTime: slots.open, closeTime: slots.close, eligible: slots.eligible, slots: slots.slots, quote: quote(db, { modelId, durationMin, qty, addons }) });
}
