import { adminGuard, err, json } from "@/server/http";
import { notificationState, notifyOwnerNewBooking } from "@/server/services/notifications";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = adminGuard(req);
  if (g instanceof Response) return g;
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || !notificationState(g.db, id)) return err("NOT_FOUND", 404);
  const status = await notifyOwnerNewBooking(g.db, id);
  return json({ ok: true, notification: status, detail: notificationState(g.db, id) });
}

