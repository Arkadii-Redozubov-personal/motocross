export const LOCALES = ["pl", "uk", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "pl";
export const LANG_COOKIE = "mq_lang";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export const LOCALE_LABEL: Record<Locale, string> = { pl: "PL", uk: "UA", ru: "RU" };
export const INTL_TAG: Record<Locale, string> = { pl: "pl-PL", uk: "uk-UA", ru: "ru-RU" };
export const HTML_LANG: Record<Locale, string> = { pl: "pl", uk: "uk", ru: "ru" };

/** Compresses weekday numbers (0=Sun) into "Mon–Fri, Sun" using the locale's own day names. */
export function formatDays(weekdays: number[], locale: Locale): string {
  const fmt = new Intl.DateTimeFormat(INTL_TAG[locale], { weekday: "short", timeZone: "UTC" });
  const name = (wd: number) => fmt.format(new Date(Date.UTC(2024, 0, 7 + wd))).replace(".", "");
  const order = [1, 2, 3, 4, 5, 6, 0].filter((d) => weekdays.includes(d));
  if (order.length === 7) return `${name(1)}–${name(0)}`;
  const runs: number[][] = [];
  for (const d of order) {
    const last = runs[runs.length - 1];
    const idx = [1, 2, 3, 4, 5, 6, 0].indexOf(d);
    if (last && [1, 2, 3, 4, 5, 6, 0].indexOf(last[last.length - 1]) === idx - 1) last.push(d);
    else runs.push([d]);
  }
  return runs.map((r) => (r.length >= 3 ? `${name(r[0])}–${name(r[r.length - 1])}` : r.map(name).join(", "))).join(", ");
}

