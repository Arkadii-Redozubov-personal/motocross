import { NextResponse } from "next/server";
import { COOKIE, sameOrigin } from "@/server/services/auth";
import { err } from "@/server/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return err("FORBIDDEN_ORIGIN", 403);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
  return res;
}

