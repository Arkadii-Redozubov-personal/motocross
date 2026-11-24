import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { adminGuard, err, json } from "@/server/http";
import { writeAudit } from "@/server/services/audit";
import { dataDir } from "@/server/db/client";

export const runtime = "nodejs";

const MAX = 5 * 1024 * 1024;

/** Detect the real type from magic bytes, never from the client-supplied name or MIME. */
function sniff(b: Buffer): "jpg" | "png" | "webp" | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (b.length > 12 && b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return "webp";
  return null;
}

export async function POST(req: Request) {
  const g = adminGuard(req);
  if (g instanceof Response) return g;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return err("VALIDATION", 422);
  if (file.size > MAX) return err("FILE_TOO_LARGE", 413);
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) return err("UNSUPPORTED_TYPE", 415);
  const name = `${randomUUID()}.${ext}`;
  const dir = resolve(dataDir(), "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(resolve(dir, name), buf);
  writeAudit(g.db, g.email, "media.upload", "file", name, { bytes: buf.length });
  return json({ ok: true, url: `/uploads/${name}` }, 201);
}

