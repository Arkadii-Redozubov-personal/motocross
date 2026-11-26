"use client";

import { useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import type { Locale } from "@/shared/i18n/config";
import type { Dict } from "@/shared/i18n/dictionaries/pl";

type RegionPreset = {
  id: string;
  label: Record<Locale, string>;
  query: string;
  zoom: number;
};

const PRESETS: RegionPreset[] = [
  {
    id: "poligon",
    label: {
      pl: "Poligon pod Wrocławiem (Niedziela)",
      uk: "Полігон біля Вроцлава (Неділя)",
      ru: "Полигон под Вроцлавом (Воскресенье)",
    },
    query: "51.199111,17.096833",
    zoom: 14,
  },
  {
    id: "karier",
    label: {
      pl: "Kopalnia piasku (Sob / Pn–Pt prywatne)",
      uk: "Піщаний кар'єр (Сб / Пн–Пт приватні)",
      ru: "Песчаный карьер (Сб / Пн–Пт частные)",
    },
    query: "50.812556,16.568194",
    zoom: 14,
  },
  {
    id: "wroclaw",
    label: {
      pl: "Wrocław — okolice",
      uk: "Вроцлав — околиці",
      ru: "Вроцлав — окрестности",
    },
    query: "Wrocław, Polska",
    zoom: 11,
  },
];

const OPEN_LABEL: Record<Locale, string> = {
  pl: "Otwórz w Google Maps",
  uk: "Відкрити в Google Maps",
  ru: "Открыть в Google Maps",
};

export function RegionMap({ d, locale }: { d: Dict; locale: Locale }) {
  const [activeId, setActiveId] = useState(PRESETS[0].id);
  const active = PRESETS.find((p) => p.id === activeId) ?? PRESETS[0];
  const encodedQuery = encodeURIComponent(active.query);

  return (
    <div className="overflow-hidden rounded-card border border-line bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center" role="group" aria-label={d.locations.mapLabel}>
          {PRESETS.map((p) => {
            const isActive = p.id === active.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveId(p.id)}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-ctl border px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-amber bg-amber text-ink"
                    : "border-line bg-card-2 text-fg-2 hover:text-fg"
                }`}
              >
                <MapPin size={14} aria-hidden="true" />
                <span>{p.label[locale]}</span>
              </button>
            );
          })}
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodedQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-amber-text hover:underline"
        >
          <span>{OPEN_LABEL[locale]}</span>
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
      <iframe
        key={active.id}
        src={`https://maps.google.com/maps?q=${encodedQuery}&t=m&z=${active.zoom}&ie=UTF8&iwloc=&output=embed&hl=${locale}`}
        title={d.locations.mapLabel}
        className="block h-[380px] w-full border-0 sm:h-[460px]"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
