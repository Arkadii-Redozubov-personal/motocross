import { adminGuard, err, json, readJson } from "@/server/http";
import { cancelBooking, confirmBooking, rejectBooking } from "@/server/services/bookings";
import { statusInput } from "@/shared/lib/validation";

export const runtime = "nodejs";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = adminGuard(req);
  if (g instanceof Response) return g;
  const { id: raw } = await ctx.params;
  const id = Number(raw);
  const p = statusInput.safeParse(await readJson(req));
  if (!Number.isInteger(id) || !p.success) return err("VALIDATION", 422);
  const r = p.data.action === "confirm" ? confirmBooking(g.db, id, g.email) : p.data.action === "reject" ? rejectBooking(g.db, id, g.email) : cancelBooking(g.db, id, g.email);
  if (r.ok) return json(r);
  const status = r.code === "NOT_FOUND" ? 404 : 409;
  return err(r.code, status, { conflicts: "conflicts" in r ? r.conflicts : undefined });
}

