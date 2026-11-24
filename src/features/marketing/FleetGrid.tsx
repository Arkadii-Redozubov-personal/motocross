"use client";

import { useState } from "react";
import type { ModelDto } from "@/server/services/catalog";
import type { Locale } from "@/shared/i18n/config";
import type { Dict } from "@/shared/i18n/dictionaries/pl";
import { ModelCard } from "./ModelCard";

export function FleetGrid({ models, d, locale }: { models: ModelDto[]; d: Dict; locale: Locale }) {
  const [cat, setCat] = useState<"all" | "quad" | "moto">("all");
  const shown = models.filter((m) => cat === "all" || m.category === cat);
  const tabs: ["all" | "quad" | "moto", string][] = [["all", d.fleet.all], ["quad", d.fleet.quad], ["moto", d.fleet.moto]];
  return (
    <div>
      <div role="tablist" aria-label={d.nav.fleet} className="mb-8 flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={cat === key}
            onClick={() => setCat(key)}
            className={`min-h-11 rounded-ctl border px-5 font-display text-base font-semibold uppercase tracking-wider transition-colors ${
              cat === key ? "border-amber bg-amber text-ink" : "border-line text-fg-2 hover:border-amber-text hover:text-amber-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {shown.length === 0 && <p className="text-fg-2">{d.fleet.empty}</p>}
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((m) => (
          <ModelCard key={m.id} m={m} d={d} locale={locale} />
        ))}
      </ul>
    </div>
  );
}
