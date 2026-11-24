"use client";

import { LOCALES, LOCALE_LABEL, type Locale } from "@/shared/i18n/config";

/** Switches language by reloading the same URL with ?lang=, so every booking parameter in the URL survives. */
export function LangSwitch({ locale, label }: { locale: Locale; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex overflow-hidden rounded-ctl border border-line">
      {LOCALES.map((l) => (
        <a
          key={l}
          href={`?lang=${l}`}
          lang={l}
          aria-current={l === locale ? "true" : undefined}
          onClick={(e) => {
            e.preventDefault();
            const u = new URL(window.location.href);
            u.searchParams.set("lang", l);
            window.location.assign(u.toString());
          }}
          className={`grid min-h-10 min-w-11 place-items-center px-2 font-display text-sm font-semibold tracking-wider transition-colors ${
            l === locale ? "bg-amber text-ink" : "text-fg-2 hover:text-amber"
          }`}
        >
          {LOCALE_LABEL[l]}
        </a>
      ))}
    </div>
  );
}

