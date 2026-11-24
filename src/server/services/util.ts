import { randomBytes } from "node:crypto";

type Bucket = { hits: number[] };
type G = typeof globalThis & { __mqRate?: Map<string, Bucket> };
const g = globalThis as G;

/** Simple in-memory sliding window limiter (single-instance MVP). */
export function rateLimit(key: string, max: number, windowMs: number, now = Date.now()): boolean {
  g.__mqRate ??= new Map();
  const b = g.__mqRate.get(key) ?? { hits: [] };
  b.hits = b.hits.filter((t) => now - t < windowMs);
  if (b.hits.length >= max) {
    g.__mqRate.set(key, b);
    return false;
  }
  b.hits.push(now);
  g.__mqRate.set(key, b);
  return true;
}

export function resetRateLimits() {
  g.__mqRate = new Map();
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim();
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function referenceCode(): string {
  const bytes = randomBytes(6);
  let s = "";
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
  return `MQ-${s}`;
}

