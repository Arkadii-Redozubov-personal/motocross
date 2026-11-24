import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { Contours, SplitTitle } from "./ui";
import { CtaBand } from "./CtaBand";
import type { Dict } from "@/shared/i18n/dictionaries/pl";
import type { Locale } from "@/shared/i18n/config";
import type { Site } from "./data";
import { todayWarsawYmd } from "@/shared/lib/time";

export function Hero({ d, locale, site }: { d: Dict; locale: Locale; site: Site }) {
  const override = site.texts.heroTitle[locale];
  const sub = site.texts.heroSubtitle[locale] || d.hero.subtitle;
  const today = todayWarsawYmd();
  return (
    <section className="relative overflow-hidden bg-obsidian">
      <Contours className="pointer-events-none absolute -left-1/4 -top-1/4 h-[150%] w-[150%] text-amber opacity-[0.13]" seed={2} />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:pb-24 lg:pt-16">
        <div className="lg:col-span-7">
          <div className="rise">
            <SplitTitle as="h1" className="h1" parts={override ? [override] : d.hero.title} />
          </div>
          <p className="rise rise-2 mt-6 max-w-xl text-lg text-fg-2 sm:text-xl">{sub}</p>
          <ul className="rise rise-2 mt-6 flex flex-wrap gap-2.5">
            {d.hero.pills.map((pill) => (
              <li key={pill} className="inline-flex items-center gap-2 rounded-ctl border border-line bg-card px-3 py-1.5 text-sm text-fg-2">
                <Check size={14} className="shrink-0 text-amber" aria-hidden="true" />
                <span>{pill}</span>
              </li>
            ))}
          </ul>
          <form action="/booking" method="get" className="rise rise-3 mt-8 grid max-w-2xl gap-3 border border-line bg-card p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" aria-label={d.hero.check}>
            <div>
              <label htmlFor="hero-date" className="label">{d.hero.date}</label>
              <input id="hero-date" name="date" type="date" min={today} className="field num" />
            </div>
            <div>
              <label htmlFor="hero-cat" className="label">{d.hero.type}</label>
              <select id="hero-cat" name="category" className="field" defaultValue="">
                <option value="">{d.hero.any}</option>
                <option value="quad">{d.hero.quad}</option>
                <option value="moto">{d.hero.moto}</option>
              </select>
            </div>
            <button type="submit" className="btn btn-amber sm:!px-5">
              {d.hero.check}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>
        </div>
        <div className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
          <div className="cut relative aspect-[4/5] w-full overflow-hidden bg-card sm:aspect-[3/4]">
            <Image src="/media/ig/fleet-pinned-cover.jpg" alt={d.hero.imgAlt} fill priority sizes="(min-width:1024px) 40vw, 90vw" className="object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian/60 via-transparent to-transparent" aria-hidden="true" />
          </div>
          <div className="cut-sm absolute -bottom-6 left-0 hidden aspect-square w-[42%] overflow-hidden border-4 border-obsidian bg-card sm:block lg:-left-10">
            <Image src="/media/ig/asix-88-profile.jpg" alt={d.hero.imgAlt2} fill sizes="(min-width:1024px) 18vw, 40vw" className="object-cover" />
          </div>
          <div className="absolute -bottom-3 right-0 hidden rounded-ctl border border-obsidian bg-amber px-4 py-3 text-ink sm:block lg:-right-4">
            <p className="num font-display text-3xl font-bold leading-none">{d.hero.badgeNum}</p>
            <p className="mt-1 font-display text-xs font-bold uppercase tracking-wider">{d.hero.badgeText}</p>
            <p className="mt-0.5 text-xs font-semibold opacity-80">{d.hero.badgeSub}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ContactStrip({ d, locale, site }: { d: Dict; locale: Locale; site: Site }) {
  return <CtaBand d={d} locale={locale} site={site} />;
}
