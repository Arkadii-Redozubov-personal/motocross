// Europe/Warsaw <-> UTC helpers (DST-safe). All timestamps are stored in UTC.
export const TZ = "Europe/Warsaw";

const dtf = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function partsAt(ms: number) {
  const out: Record<string, number> = {};
  for (const p of dtf.formatToParts(new Date(ms))) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return out;
}

/** Offset of Europe/Warsaw from UTC at the given instant, in ms. */
function offsetAt(ms: number): number {
  const p = partsAt(ms);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(ms / 1000) * 1000;
}

export function isValidYmd(ymd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isValidHm(hm: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(hm);
}

/** Wall-clock time in Europe/Warsaw -> UTC instant (ISO string). */
export function warsawToUtcMs(ymd: string, hm: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  const [h, mi] = hm.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  let utc = guess - offsetAt(guess);
  utc = guess - offsetAt(utc);
  return utc;
}

export function warsawToUtcIso(ymd: string, hm: string): string {
  return new Date(warsawToUtcMs(ymd, hm)).toISOString();
}

export function utcIsoToWarsaw(iso: string): { ymd: string; hm: string } {
  const p = partsAt(Date.parse(iso));
  const pad = (n: number) => String(n).padStart(2, "0");
  return { ymd: `${p.year}-${pad(p.month)}-${pad(p.day)}`, hm: `${pad(p.hour)}:${pad(p.minute)}` };
}

export function todayWarsawYmd(now: number = Date.now()): string {
  return utcIsoToWarsaw(new Date(now).toISOString()).ymd;
}

/** 0 = Sunday ... 6 = Saturday for a calendar date (timezone independent). */
export function weekdayOf(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToHm(min: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

export function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

