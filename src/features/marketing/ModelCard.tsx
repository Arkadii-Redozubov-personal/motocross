import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bike, Gauge } from "lucide-react";
import type { ModelDto } from "@/server/services/catalog";
import type { Locale } from "@/shared/i18n/config";
import type { Dict } from "@/shared/i18n/dictionaries/pl";

const POS: Record<string, string> = {
  "segway-at5l": "50% 25%",
  "tgb-4x4": "30% 60%",
  "enduro-250": "50% 55%",
  "enduro-standard": "50% 55%",
  "enduro-300-start": "50% 45%",
};

export function ModelCard({ m, d, locale }: { m: ModelDto; d: Dict; locale: Locale }) {
  const fmtDur = (min: number) => (min % 60 === 0 ? `${min / 60}${d.common.hours.slice(0, 1)}` : `${min}m`);
  const hourly = Math.min(...m.rates.map((r) => Math.round((r.amount_pln / r.duration_min) * 60)));
  return (
    <li className="flex flex-col overflow-hidden rounded-card border border-line bg-card">
      <div className="relative aspect-[4/3] bg-card-2">
        {m.image ? (
          <Image
            src={m.image}
            alt={m.title[locale]}
            fill
            sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 95vw"
            className="object-cover"
            style={{ objectPosition: POS[m.slug] ?? "50% 50%" }}
          />
        ) : (
          <div className="grid h-full place-items-center text-fg-3">{d.fleet.noImage}</div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded bg-[#1c1d21]/90 px-2.5 py-1 font-display text-sm font-semibold uppercase tracking-wider text-[#f5f5f4]">
          {m.category === "quad" ? <Gauge size={14} aria-hidden="true" /> : <Bike size={14} aria-hidden="true" />}
          {m.category === "quad" ? d.fleet.quadTag : d.fleet.motoTag}
        </span>
        {m.beginner && (
          <span className="absolute right-3 top-3 rounded bg-flame px-2.5 py-1 font-display text-sm font-semibold uppercase tracking-wider text-ink">{d.fleet.beginner}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="h3">{m.title[locale]}</h3>
        <p className="mt-2 text-fg-2">{m.desc[locale]}</p>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-2">
          {m.specs[locale].split("|").filter(Boolean).map((s) => (
            <li key={s} className="flex items-center gap-1.5">
              <span className="size-1.5 rotate-45 bg-amber" aria-hidden="true" />
              {s}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          {m.rates.map((r) => (
            <span key={r.duration_min} className="num rounded border border-line bg-card-2 px-2 py-0.5 text-xs text-fg-2">
              {fmtDur(r.duration_min)}: <strong className="text-fg">{r.amount_pln} {d.common.zl}</strong>
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-sm text-fg-3">
              {d.fleet.from}
              <span className="mx-1">·</span>
              {d.fleet.units} <span className="num">{m.units}</span>
            </p>
            <p className="num font-display text-3xl font-bold text-amber-text">
              {hourly} <span className="text-base font-medium text-fg-2">{d.common.perHour}</span>
            </p>
          </div>
          <Link href={`/booking?model=${m.slug}`} className="btn btn-amber !px-4" aria-label={`${d.common.book}: ${m.title[locale]}`}>
            {d.common.book}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </li>
  );
}

