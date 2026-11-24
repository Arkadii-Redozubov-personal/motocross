import { adminGuard, json } from "@/server/http";
import { listBookings } from "@/server/services/bookings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const g = adminGuard(req);
  if (g instanceof Response) return g;
  const u = new URL(req.url).searchParams;
  const num = (k: string) => (u.get(k) ? Number(u.get(k)) : undefined);
  const bookings = listBookings(g.db, {
    status: u.get("status") || undefined,
    date: /^\d{4}-\d{2}-\d{2}$/.test(u.get("date") ?? "") ? u.get("date")! : undefined,
    locationId: num("locationId"),
    modelId: num("modelId"),
    q: u.get("q")?.slice(0, 60) || undefined,
  });
  return json({ ok: true, bookings });
}

