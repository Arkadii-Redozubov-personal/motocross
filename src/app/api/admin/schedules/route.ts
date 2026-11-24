import { adminGuard, err, json, readJson } from "@/server/http";
import { writeAudit } from "@/server/services/audit";
import { getExceptions, getLocations, saveSchedule } from "@/server/services/catalog";
import { scheduleInput } from "@/shared/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const g = adminGuard(req);
  if (g instanceof Response) return g;
  return json({ ok: true, locations: getLocations(g.db), exceptions: getExceptions(g.db) });
}

/** Saving a schedule never cancels or rewrites existing bookings (TZ 4.1). */
export async function PUT(req: Request) {
  const g = adminGuard(req);
  if (g instanceof Response) return g;
  const p = scheduleInput.safeParse(await readJson(req));
  if (!p.success) return err("VALIDATION", 422, { fields: p.error.issues.map((i) => i.path.join(".")) });
  saveSchedule(g.db, p.data);
  writeAudit(g.db, g.email, "schedule.save", "schedule");
  return json({ ok: true });
}

