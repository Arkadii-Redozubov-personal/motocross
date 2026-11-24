import type { DatabaseSync } from "node:sqlite";

export function migrate(db: DatabaseSync) {
  db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_is_default INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  city_pl TEXT NOT NULL, city_uk TEXT NOT NULL, city_ru TEXT NOT NULL,
  address_pl TEXT NOT NULL DEFAULT '', address_uk TEXT NOT NULL DEFAULT '', address_ru TEXT NOT NULL DEFAULT '',
  timezone TEXT NOT NULL DEFAULT 'Europe/Warsaw',
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY,
  location_id INTEGER NOT NULL REFERENCES locations(id),
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  is_open INTEGER NOT NULL DEFAULT 0,
  open_time TEXT NOT NULL DEFAULT '09:00',
  close_time TEXT NOT NULL DEFAULT '18:00',
  UNIQUE (location_id, weekday)
);

CREATE TABLE IF NOT EXISTS schedule_exceptions (
  id INTEGER PRIMARY KEY,
  location_id INTEGER NOT NULL REFERENCES locations(id),
  date_ymd TEXT NOT NULL,
  is_open INTEGER NOT NULL DEFAULT 0,
  open_time TEXT NOT NULL DEFAULT '09:00',
  close_time TEXT NOT NULL DEFAULT '18:00',
  note TEXT NOT NULL DEFAULT '',
  UNIQUE (location_id, date_ymd)
);

CREATE TABLE IF NOT EXISTS vehicle_models (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('quad','moto')),
  title_pl TEXT NOT NULL, title_uk TEXT NOT NULL, title_ru TEXT NOT NULL,
  desc_pl TEXT NOT NULL DEFAULT '', desc_uk TEXT NOT NULL DEFAULT '', desc_ru TEXT NOT NULL DEFAULT '',
  specs_pl TEXT NOT NULL DEFAULT '', specs_uk TEXT NOT NULL DEFAULT '', specs_ru TEXT NOT NULL DEFAULT '',
  beginner_flag INTEGER NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  model_id INTEGER NOT NULL REFERENCES vehicle_models(id),
  location_id INTEGER REFERENCES locations(id),
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS rates (
  id INTEGER PRIMARY KEY,
  model_id INTEGER NOT NULL REFERENCES vehicle_models(id),
  duration_min INTEGER NOT NULL CHECK (duration_min > 0),
  amount_pln INTEGER NOT NULL CHECK (amount_pln >= 0),
  currency TEXT NOT NULL DEFAULT 'PLN',
  UNIQUE (model_id, duration_min)
);

CREATE TABLE IF NOT EXISTS addons (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_pl TEXT NOT NULL, title_uk TEXT NOT NULL, title_ru TEXT NOT NULL,
  pricing_mode TEXT NOT NULL CHECK (pricing_mode IN ('per_hour','flat')),
  amount_pln INTEGER NOT NULL CHECK (amount_pln >= 0),
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY,
  reference_code TEXT NOT NULL UNIQUE,
  location_id INTEGER NOT NULL REFERENCES locations(id),
  starts_at_utc TEXT NOT NULL,
  ends_at_utc TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('NEW','CONFIRMED','REJECTED','CANCELLED')),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  comment TEXT NOT NULL DEFAULT '',
  addons_json TEXT NOT NULL DEFAULT '[]',
  total_amount_pln INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PLN',
  idempotency_key TEXT UNIQUE,
  lang TEXT NOT NULL DEFAULT 'pl',
  notification_status TEXT NOT NULL DEFAULT 'PENDING',
  notification_error TEXT,
  consent_at_utc TEXT NOT NULL,
  utm_json TEXT,
  created_at_utc TEXT NOT NULL,
  decided_at_utc TEXT
);
CREATE INDEX IF NOT EXISTS idx_bookings_start ON bookings(starts_at_utc);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

CREATE TABLE IF NOT EXISTS booking_items (
  id INTEGER PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  model_id INTEGER NOT NULL REFERENCES vehicle_models(id),
  qty INTEGER NOT NULL CHECK (qty > 0),
  unit_price_snapshot_pln INTEGER NOT NULL,
  model_title_snapshot TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS booking_allocations (
  id INTEGER PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  asset_id INTEGER NOT NULL REFERENCES assets(id),
  starts_at_utc TEXT NOT NULL,
  ends_at_utc TEXT NOT NULL,
  CHECK (starts_at_utc < ends_at_utc)
);
CREATE INDEX IF NOT EXISTS idx_alloc_asset ON booking_allocations(asset_id, starts_at_utc, ends_at_utc);

-- DB-level invariant: one asset can never hold two overlapping allocations ([start, end) intervals).
CREATE TRIGGER IF NOT EXISTS trg_alloc_no_overlap
BEFORE INSERT ON booking_allocations
FOR EACH ROW
WHEN EXISTS (
  SELECT 1 FROM booking_allocations
  WHERE asset_id = NEW.asset_id AND starts_at_utc < NEW.ends_at_utc AND ends_at_utc > NEW.starts_at_utc
)
BEGIN
  SELECT RAISE(ABORT, 'ASSET_OVERLAP');
END;

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details_json TEXT,
  created_at_utc TEXT NOT NULL
);
`);
}

