import { after } from "next/server";
import { getDb } from "@/server/db/client";
import { createBooking } from "@/server/services/bookings";
import { notifyOwnerNewBooking } from "@/server/services/notifications";
import { clientIp, rateLimit } from "@/server/services/util";
import { err, json, readJson } from "@/server/http";
import { bookingInput } from "@/shared/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!rateLimit(`book:${clientIp(req)}`, 6, 10 * 60_000)) return err("RATE_LIMITED", 429);
  const body = await readJson(req);
  const parsed = bookingInput.safeParse(body);
  if (!parsed.success) {
    return err("VALIDATION", 422, { fields: parsed.error.issues.map((i) => i.path.join(".")) });
  }
  const db = getDb();
  const result = createBooking(db, parsed.data);
  if (!result.ok) return err(result.code, result.status);
  if (!result.duplicate) {
    const id = result.booking.id;
    after(async () => {
      await notifyOwnerNewBooking(db, id);
    });
  }
  const { id: _id, ...publicBooking } = result.booking;
  void _id;
  return json({ ok: true, duplicate: result.duplicate, booking: publicBooking }, result.duplicate ? 200 : 201);
}

