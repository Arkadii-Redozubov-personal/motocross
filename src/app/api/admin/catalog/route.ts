import { adminGuard, err, json, readJson } from "@/server/http";
import { writeAudit } from "@/server/services/audit";
import { addonInput, assetInput, modelInput } from "@/shared/lib/validation";
import { getAddons, getLocations, getModels, modelExists, updateAddon, upsertAsset, upsertModel } from "@/server/services/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const g = adminGuard(req);
  if (g instanceof Response) return g;
  return json({ ok: true, models: getModels(g.db, false), addons: getAddons(g.db, false), locations: getLocations(g.db) });
}

/** PUT {kind:'model'|'asset'|'addon', ...payload} — create or update. Models are hidden (published=false), never hard-deleted. */
export async function PUT(req: Request) {
  const g = adminGuard(req);
  if (g instanceof Response) return g;
  const body = (await readJson(req)) as { kind?: string; data?: unknown } | null;
  try {
    if (body?.kind === "model") {
      const p = modelInput.safeParse(body.data);
      if (!p.success) return err("VALIDATION", 422, { fields: p.error.issues.map((i) => i.path.join(".")) });
      const id = upsertModel(g.db, p.data);
      writeAudit(g.db, g.email, "catalog.model_save", "vehicle_model", String(id));
      return json({ ok: true, id });
    }
    if (body?.kind === "asset") {
      const p = assetInput.safeParse(body.data);
      if (!p.success || !modelExists(g.db, p.data.model_id)) return err("VALIDATION", 422);
      const id = upsertAsset(g.db, p.data);
      writeAudit(g.db, g.email, "catalog.asset_save", "asset", String(id));
      return json({ ok: true, id });
    }
    if (body?.kind === "addon") {
      const p = addonInput.safeParse(body.data);
      if (!p.success) return err("VALIDATION", 422);
      updateAddon(g.db, p.data);
      writeAudit(g.db, g.email, "catalog.addon_save", "addon", String(p.data.id));
      return json({ ok: true });
    }
  } catch (e) {
    if (String((e as Error).message).includes("UNIQUE")) return err("DUPLICATE", 409);
    throw e;
  }
  return err("VALIDATION", 422);
}

