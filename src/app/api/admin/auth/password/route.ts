import { adminGuard, err, json, readJson } from "@/server/http";
import { changePassword } from "@/server/services/auth";
import { writeAudit } from "@/server/services/audit";
import { passwordInput } from "@/shared/lib/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const g = adminGuard(req);
  if (g instanceof Response) return g;
  const p = passwordInput.safeParse(await readJson(req));
  if (!p.success) return err("VALIDATION", 422);
  if (!changePassword(g.db, g.email, p.data.current, p.data.next)) return err("INVALID_CREDENTIALS", 401);
  writeAudit(g.db, g.email, "auth.password_change", "admin_user");
  return json({ ok: true });
}

