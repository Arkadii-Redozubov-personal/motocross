import type { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { migrate } from "./schema";
import { seedIfEmpty } from "./seed";

type G = typeof globalThis & { __mqDb?: DatabaseSync };
const g = globalThis as G;

export function openDatabase(path: string): DatabaseSync {
  const sqlite = process.getBuiltinModule("node:sqlite") as typeof import("node:sqlite");
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new sqlite.DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  migrate(db);
  return db;
}

export function dataDir(): string {
  return resolve(process.env.DATA_DIR ?? "data");
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

