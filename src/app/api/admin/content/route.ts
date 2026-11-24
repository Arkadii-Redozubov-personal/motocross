import { adminGuard, err, json, readJson } from "@/server/http";
import { writeAudit } from "@/server/services/audit";
import { getSetting, setSetting } from "@/server/services/settings";
import { contentInput } from "@/shared/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const g = adminGuard(req);
  if (g instanceof Response) return g;
  return json({
    ok: true,
    contact: getSetting(g.db, "contact"), texts: getSetting(g.db, "texts"), promo: getSetting(g.db, "promo"), gallery: getSetting(g.db, "gallery"),
  });
}

export async function PUT(req: Request) {
  const g = adminGuard(req);
  if (g instanceof Response) return g;
  const p = contentInput.safeParse(await readJson(req));
  if (!p.success) return err("VALIDATION", 422, { fields: p.error.issues.map((i) => i.path.join(".")) });
  for (const k of ["contact", "texts", "promo", "gallery"] as const) setSetting(g.db, k, p.data[k] as never);
  writeAudit(g.db, g.email, "content.save", "site_settings");
  return json({ ok: true });
}

