import type { DatabaseSync } from "node:sqlite";
import { createHmac, timingSafeEqual } from "node:crypto";
import { one, run } from "../db/client";
import { getSessionSecret } from "./settings";
import { hashPassword, verifyPassword } from "./password";

export const COOKIE = "mq_admin";
const TTL_MS = 8 * 3600_000;

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = (db: DatabaseSync, payload: string) => createHmac("sha256", getSessionSecret(db)).update(payload).digest("base64url");

export function createSessionToken(db: DatabaseSync, email: string, now = Date.now()): string {
  const payload = b64(JSON.stringify({ email, exp: now + TTL_MS }));
  return `${payload}.${sign(db, payload)}`;
}

export function verifySessionToken(db: DatabaseSync, token: string | undefined | null, now = Date.now()): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(db, payload);
  const a = Buffer.from(sig);
  const e = Buffer.from(expected);
  if (a.length !== e.length || !timingSafeEqual(a, e)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { email: string; exp: number };
    if (data.exp < now) return null;
    const exists = one(db, "SELECT 1 AS x FROM admin_users WHERE email = ?", data.email);
    return exists ? data.email : null;
  } catch {
    return null;
  }
}

export function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

export function adminFromRequest(db: DatabaseSync, req: Request): string | null {
  return verifySessionToken(db, readCookie(req.headers.get("cookie"), COOKIE));
}

/** CSRF defence for cookie auth: state-changing requests must come from our own origin. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function login(db: DatabaseSync, email: string, password: string): { ok: true; token: string; mustChange: boolean } | { ok: false } {
  const u = one<{ password_hash: string; password_is_default: number }>(db, "SELECT password_hash, password_is_default FROM admin_users WHERE email = ?", email);
  // Always run a hash comparison to keep timing similar for unknown users.
  const ok = verifyPassword(password, u?.password_hash ?? "scrypt$00$00");
  if (!u || !ok) return { ok: false };
  return { ok: true, token: createSessionToken(db, email), mustChange: u.password_is_default === 1 };
}

export function changePassword(db: DatabaseSync, email: string, current: string, next: string): boolean {
  const u = one<{ password_hash: string }>(db, "SELECT password_hash FROM admin_users WHERE email = ?", email);
  if (!u || !verifyPassword(current, u.password_hash)) return false;
  run(db, "UPDATE admin_users SET password_hash = ?, password_is_default = 0, updated_at = ? WHERE email = ?", hashPassword(next), new Date().toISOString(), email);
  return true;
}

export function passwordIsDefault(db: DatabaseSync, email: string): boolean {
  return one<{ password_is_default: number }>(db, "SELECT password_is_default FROM admin_users WHERE email = ?", email)?.password_is_default === 1;
}

