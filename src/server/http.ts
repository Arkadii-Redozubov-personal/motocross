import type { DatabaseSync } from "node:sqlite";
import { getDb } from "./db/client";
import { adminFromRequest, sameOrigin } from "./services/auth";

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store, max-age=0", ...headers } });
}

export function err(code: string, status: number, extra: Record<string, unknown> = {}) {
  return json({ ok: false, code, ...extra }, status);
}

/** Authorises an admin API call: valid session cookie, and same-origin for state-changing methods. */
export function adminGuard(req: Request): { db: DatabaseSync; email: string } | Response {
  const db = getDb();
  const email = adminFromRequest(db, req);
  if (!email) return err("UNAUTHORIZED", 401);
  if (req.method !== "GET" && req.method !== "HEAD" && !sameOrigin(req)) return err("FORBIDDEN_ORIGIN", 403);
  return { db, email };
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

