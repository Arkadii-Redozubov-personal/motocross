import type { DatabaseSync } from "node:sqlite";
import { all, one, run } from "../db/client";
import type { L3 } from "./settings";
import type { z } from "zod";
import type { addonInput, assetInput, modelInput, scheduleInput } from "@/shared/lib/validation";

export type ModelDto = {
  id: number; slug: string; category: "quad" | "moto"; title: L3; desc: L3; specs: L3; beginner: boolean; image: string; published: boolean; sort: number;
  rates: { duration_min: number; amount_pln: number }[]; units: number;
  assets: { id: number; code: string; location_id: number | null; active: boolean }[];
};
export type AddonDto = { id: number; slug: string; title: L3; pricing_mode: "per_hour" | "flat"; amount_pln: number; active: boolean };
export type LocationDto = {
  id: number; slug: string; city: L3; address: L3; active: boolean;
  schedules: { weekday: number; is_open: boolean; open_time: string; close_time: string }[];
};
export type ExceptionDto = { id: number; location_id: number; date_ymd: string; is_open: boolean; open_time: string; close_time: string; note: string };

const l3 = (r: Record<string, unknown>, p: string): L3 => ({ pl: String(r[`${p}_pl`] ?? ""), uk: String(r[`${p}_uk`] ?? ""), ru: String(r[`${p}_ru`] ?? "") });

export function getModels(db: DatabaseSync, publishedOnly: boolean): ModelDto[] {
  const rows = all<Record<string, unknown>>(db, `SELECT * FROM vehicle_models ${publishedOnly ? "WHERE published = 1" : ""} ORDER BY sort_order, id`);
  return rows.map((r) => {
    const assets = all<{ id: number; code: string; location_id: number | null; active: number }>(db, "SELECT id, code, location_id, active FROM assets WHERE model_id = ? ORDER BY code", r.id).map((a) => ({ ...a, active: a.active === 1 }));
    return {
      id: Number(r.id), slug: String(r.slug), category: r.category as "quad" | "moto",
      title: l3(r, "title"), desc: l3(r, "desc"), specs: l3(r, "specs"),
      beginner: r.beginner_flag === 1, image: String(r.image_url), published: r.published === 1, sort: Number(r.sort_order),
      rates: all<{ duration_min: number; amount_pln: number }>(db, "SELECT duration_min, amount_pln FROM rates WHERE model_id = ? ORDER BY duration_min", r.id),
      units: assets.filter((a) => a.active).length, assets,
    };
  });
}

export function getAddons(db: DatabaseSync, activeOnly: boolean): AddonDto[] {
  return all<Record<string, unknown>>(db, `SELECT * FROM addons ${activeOnly ? "WHERE active = 1" : ""} ORDER BY id`).map((r) => ({
    id: Number(r.id), slug: String(r.slug), title: l3(r, "title"), pricing_mode: r.pricing_mode as "per_hour" | "flat", amount_pln: Number(r.amount_pln), active: r.active === 1,
  }));
}

export function getLocations(db: DatabaseSync, activeOnly = false): LocationDto[] {
  return all<Record<string, unknown>>(db, `SELECT * FROM locations ${activeOnly ? "WHERE active = 1" : ""} ORDER BY id`).map((r) => ({
    id: Number(r.id), slug: String(r.slug), city: l3(r, "city"), address: l3(r, "address"), active: r.active === 1,
    schedules: all<{ weekday: number; is_open: number; open_time: string; close_time: string }>(db, "SELECT weekday, is_open, open_time, close_time FROM schedules WHERE location_id = ? ORDER BY weekday", r.id)
      .map((s) => ({ ...s, is_open: s.is_open === 1 })),
  }));
}

export function getExceptions(db: DatabaseSync): ExceptionDto[] {
  return all<Record<string, unknown>>(db, "SELECT * FROM schedule_exceptions ORDER BY date_ymd").map((r) => ({
    id: Number(r.id), location_id: Number(r.location_id), date_ymd: String(r.date_ymd), is_open: r.is_open === 1, open_time: String(r.open_time), close_time: String(r.close_time), note: String(r.note),
  }));
}

export function upsertModel(db: DatabaseSync, m: z.infer<typeof modelInput>): number {
  db.exec("BEGIN IMMEDIATE");
  try {
    let id = m.id;
    const vals = [m.slug, m.category, m.title.pl, m.title.uk, m.title.ru, m.desc.pl, m.desc.uk, m.desc.ru, m.specs.pl, m.specs.uk, m.specs.ru, m.beginner_flag ? 1 : 0, m.image_url, m.published ? 1 : 0, m.sort_order];
    if (id) {
      run(db, `UPDATE vehicle_models SET slug=?, category=?, title_pl=?, title_uk=?, title_ru=?, desc_pl=?, desc_uk=?, desc_ru=?, specs_pl=?, specs_uk=?, specs_ru=?, beginner_flag=?, image_url=?, published=?, sort_order=? WHERE id=?`, ...vals, id);
    } else {
      id = Number(run(db, `INSERT INTO vehicle_models (slug, category, title_pl, title_uk, title_ru, desc_pl, desc_uk, desc_ru, specs_pl, specs_uk, specs_ru, beginner_flag, image_url, published, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, ...vals).lastInsertRowid);
    }
    run(db, "DELETE FROM rates WHERE model_id = ?", id);
    for (const r of m.rates) run(db, "INSERT INTO rates (model_id, duration_min, amount_pln) VALUES (?,?,?)", id, r.duration_min, r.amount_pln);
    db.exec("COMMIT");
    return id!;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export function upsertAsset(db: DatabaseSync, a: z.infer<typeof assetInput>): number {
  if (a.id) {
    run(db, "UPDATE assets SET code=?, model_id=?, location_id=?, active=? WHERE id=?", a.code, a.model_id, a.location_id, a.active ? 1 : 0, a.id);
    return a.id;
  }
  return Number(run(db, "INSERT INTO assets (code, model_id, location_id, active) VALUES (?,?,?,?)", a.code, a.model_id, a.location_id, a.active ? 1 : 0).lastInsertRowid);
}

export function updateAddon(db: DatabaseSync, a: z.infer<typeof addonInput>) {
  run(db, "UPDATE addons SET title_pl=?, title_uk=?, title_ru=?, pricing_mode=?, amount_pln=?, active=? WHERE id=?", a.title.pl, a.title.uk, a.title.ru, a.pricing_mode, a.amount_pln, a.active ? 1 : 0, a.id);
}

export function saveSchedule(db: DatabaseSync, s: z.infer<typeof scheduleInput>) {
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const l of s.locations) run(db, "UPDATE locations SET active=?, address_pl=?, address_uk=?, address_ru=? WHERE id=?", l.active ? 1 : 0, l.address_pl, l.address_uk, l.address_ru, l.id);
    for (const w of s.schedules) {
      run(db, `INSERT INTO schedules (location_id, weekday, is_open, open_time, close_time) VALUES (?,?,?,?,?)
               ON CONFLICT(location_id, weekday) DO UPDATE SET is_open=excluded.is_open, open_time=excluded.open_time, close_time=excluded.close_time`,
        w.location_id, w.weekday, w.is_open ? 1 : 0, w.open_time, w.close_time);
    }
    run(db, "DELETE FROM schedule_exceptions");
    for (const x of s.exceptions) {
      run(db, "INSERT OR REPLACE INTO schedule_exceptions (location_id, date_ymd, is_open, open_time, close_time, note) VALUES (?,?,?,?,?,?)", x.location_id, x.date_ymd, x.is_open ? 1 : 0, x.open_time, x.close_time, x.note);
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export function modelExists(db: DatabaseSync, id: number): boolean {
  return !!one(db, "SELECT 1 AS x FROM vehicle_models WHERE id = ?", id);
}

