"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { Dict } from "@/shared/i18n/dictionaries/pl";

export function HeroSearchForm({ d, today }: { d: Dict; today: string }) {
  const [date, setDate] = useState("");
  return (
    <form
      action="/booking"
      method="get"
      className="rise rise-3 mt-8 grid max-w-2xl gap-3 border border-line bg-card/95 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      aria-label={d.hero.check}
    >
      <div>
        <label htmlFor="hero-date" className="label">{d.hero.date}</label>
        <div className="relative">
          <input
            id="hero-date"
            name="date"
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`field num ${!date ? "text-transparent [&::-webkit-datetime-edit]:opacity-0" : ""}`}
          />
          {!date && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-3.5 right-10 flex items-center truncate text-fg-3"
            >
              {d.hero.datePlaceholder}
            </span>
          )}
        </div>
      </div>
      <div>
        <label htmlFor="hero-cat" className="label">{d.hero.type}</label>
        <div className="relative">
          <select id="hero-cat" name="category" className="field appearance-none pr-10" defaultValue="">
            <option value="">{d.hero.any}</option>
            <option value="quad">{d.hero.quad}</option>
            <option value="moto">{d.hero.moto}</option>
          </select>
          <ChevronDown
            size={18}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-2"
            aria-hidden="true"
          />
        </div>
      </div>
      <button type="submit" className="btn btn-amber sm:!px-5">
        {d.hero.check}
        <ArrowRight size={18} aria-hidden="true" />
      </button>
    </form>
  );
}

