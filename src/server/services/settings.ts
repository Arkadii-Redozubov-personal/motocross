import type { DatabaseSync } from "node:sqlite";
import { one, run } from "../db/client";

export type L3 = { pl: string; uk: string; ru: string };
export type Contact = { phone: string; email: string; ownerEmail: string; instagramUrl: string; facebookUrl: string; telegramUrl: string };
export type BookingSettings = { slotStepMin: number; minLeadMin: number; horizonDays: number };
export type Texts = { heroTitle: L3; heroSubtitle: L3 };
export type Promo = { enabled: boolean; title: L3; body: L3 };
export type GalleryItem = { id: string; src: string; alt: L3; visible: boolean };

export type SettingsMap = {
  contact: Contact;
  booking: BookingSettings;
  texts: Texts;
  promo: Promo;
  gallery: GalleryItem[];
};

const EMPTY3: L3 = { pl: "", uk: "", ru: "" };
const DEFAULTS: SettingsMap = {
  contact: { phone: "", email: "", ownerEmail: "", instagramUrl: "", facebookUrl: "", telegramUrl: "" },
  booking: { slotStepMin: 60, minLeadMin: 60, horizonDays: 90 },
  texts: { heroTitle: EMPTY3, heroSubtitle: EMPTY3 },
  promo: { enabled: false, title: EMPTY3, body: EMPTY3 },
  gallery: [],
};

export function getSetting<K extends keyof SettingsMap>(db: DatabaseSync, key: K): SettingsMap[K] {
  const row = one<{ value_json: string }>(db, "SELECT value_json FROM site_settings WHERE key = ?", key);
  if (!row) return DEFAULTS[key];
  const parsed = JSON.parse(row.value_json);
  const def = DEFAULTS[key];
  return (Array.isArray(def) ? parsed : { ...def, ...parsed }) as SettingsMap[K];
}

export function setSetting<K extends keyof SettingsMap>(db: DatabaseSync, key: K, value: SettingsMap[K]) {
  run(db,
    `INSERT INTO site_settings (key, value_json, updated_at_utc) VALUES (?,?,?)
     ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at_utc = excluded.updated_at_utc`,
    key, JSON.stringify(value), new Date().toISOString());
}

export function getSessionSecret(db: DatabaseSync): string {
  const row = one<{ value_json: string }>(db, "SELECT value_json FROM site_settings WHERE key = 'session_secret'");
  return row ? (JSON.parse(row.value_json) as string) : "dev-secret-change-me";
}

