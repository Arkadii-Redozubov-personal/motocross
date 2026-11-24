import type { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { migrate } from "./schema";
import { seedIfEmpty } from "./seed";

type G = typeof globalThis & { __mqDb?: DatabaseSync };
const g = globalThis as G;

const READONLY_CODES = new Set(["EROFS", "EACCES", "EPERM"]);

function tryOpenFile(sqlite: typeof import("node:sqlite"), path: string): DatabaseSync {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  return new sqlite.DatabaseSync(path);
}

export function openDatabase(path: string): DatabaseSync {
  const sqlite = process.getBuiltinModule?.("node:sqlite") as typeof import("node:sqlite") | undefined;
  if (!sqlite) {
    throw new Error(`node:sqlite is unavailable on Node ${process.version}; Node >= 22.13 is required`);
  }

  let db: DatabaseSync;
  if (path === ":memory:") {
    db = new sqlite.DatabaseSync(":memory:");
  } else {
    try {
      db = tryOpenFile(sqlite, path);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (!code || !READONLY_CODES.has(code)) throw err;
      try {
        db = tryOpenFile(sqlite, resolve(tmpdir(), "moto-quad-data", "motocross.sqlite"));
      } catch {
        db = new sqlite.DatabaseSync(":memory:");
      }
    }
  }

  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  migrate(db);
  return db;
}

export function dataDir(): string {
  if (process.env.DATA_DIR) return resolve(process.env.DATA_DIR);
  if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL) {
    return resolve(tmpdir(), "moto-quad-data");
  }
  return resolve("data");
}

export function getDb(): DatabaseSync {
  if (!g.__mqDb) {
    const path = process.env.DB_PATH ?? resolve(dataDir(), "motocross.sqlite");
    const db = openDatabase(path);
    seedIfEmpty(db);
    g.__mqDb = db;
  }
  return g.__mqDb;
}

/** Tests only: inject an isolated database. */
export function setDbForTests(db: DatabaseSync | undefined) {
  g.__mqDb = db;
}

export type Row = Record<string, unknown>;

export function all<T = Row>(db: DatabaseSync, sql: string, ...params: unknown[]): T[] {
  const rows = db.prepare(sql).all(...(params as never[])) as Row[];
  return rows.map((r) => ({ ...r }) as T);
}
export function one<T = Row>(db: DatabaseSync, sql: string, ...params: unknown[]): T | undefined {
  const row = db.prepare(sql).get(...(params as never[])) as Row | undefined;
  return row ? ({ ...row } as T) : undefined;
}
export function run(db: DatabaseSync, sql: string, ...params: unknown[]) {
  return db.prepare(sql).run(...(params as never[]));
}
