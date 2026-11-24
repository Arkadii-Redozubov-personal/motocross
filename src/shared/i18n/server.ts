import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LANG_COOKIE, isLocale, type Locale } from "./config";
import { pl, type Dict } from "./dictionaries/pl";
import { uk } from "./dictionaries/uk";
import { ru } from "./dictionaries/ru";

const DICTS: Record<Locale, Dict> = { pl, uk, ru };

export function getDict(locale: Locale): Dict {
  return DICTS[locale];
}

/** Locale resolved by middleware (?lang= > cookie > default). */
export async function getLocale(): Promise<Locale> {
  const h = (await headers()).get("x-locale");
  if (isLocale(h)) return h;
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  return isLocale(c) ? c : DEFAULT_LOCALE;
}

