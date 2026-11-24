import { NextResponse } from "next/server";
import { getDb } from "@/server/db/client";
import { COOKIE, login, sameOrigin } from "@/server/services/auth";
import { clientIp, rateLimit } from "@/server/services/util";
import { err, readJson } from "@/server/http";
import { loginInput } from "@/shared/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return err("FORBIDDEN_ORIGIN", 403);
  if (!rateLimit(`login:${clientIp(req)}`, 8, 15 * 60_000)) return err("RATE_LIMITED", 429);
  const parsed = loginInput.safeParse(await readJson(req));
  if (!parsed.success) return err("VALIDATION", 422);
  const r = login(getDb(), parsed.data.email, parsed.data.password);
  if (!r.ok) return err("INVALID_CREDENTIALS", 401);
  const res = NextResponse.json({ ok: true, mustChange: r.mustChange }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(COOKIE, r.token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production" && req.headers.get("x-forwarded-proto") === "https",
    path: "/",
    maxAge: 8 * 3600,
  });
  return res;
}

