import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, BadgeCheck, Check, ChevronDown, ChevronUp, Clock, Facebook, Fuel,
  GraduationCap, HardHat, Instagram, Mail, MapPin, Phone, Quote, Ruler, Send, Shirt,
} from "lucide-react";
import { SplitTitle, formatPhoneHref, Wordmark } from "./ui";
import { ModelCard } from "./ModelCard";
import { FleetGrid } from "./FleetGrid";
import { GalleryGrid } from "./GalleryGrid";
import { LangSwitch } from "./LangSwitch";
import { RegionMap } from "./RegionMap";
import type { Dict } from "@/shared/i18n/dictionaries/pl";
import { formatDays, type Locale } from "@/shared/i18n/config";
import type { Site } from "./data";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6";
export type Surface = "obsidian" | "slate" | "light" | "paper";
const bgOf = (s: Surface) =>
  s === "obsidian" ? "bg-obsidian" :
  s === "slate" ? "bg-slate-deep" :
  s === "light" ? "surface-light" :
  "surface-paper";

const FLAGSHIP_SLUGS = ["quad-kymco-4x4", "honda-crf250r", "pitbike-start"];

export function FleetTeaser({ d, locale, site, surface = "slate" }: { d: Dict; locale: Locale; site: Site; surface?: Surface }) {
  const picked = FLAGSHIP_SLUGS.map((slug) => site.models.find((m) => m.slug === slug)).filter(
    (m): m is Site["models"][number] => Boolean(m)
  );
  for (const m of site.models) {
    if (picked.length >= 3) break;
    if (!picked.some((p) => p.id === m.id)) picked.push(m);
  }
  return (
    <section id="fleet" className={`${bgOf(surface)} py-16 lg:py-24`}>
      <div className={wrap}>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <SplitTitle parts={d.fleet.title} />
          <Link href="/fleet" className="btn btn-ghost">
            {d.home.fleetAll}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {picked.map((m) => (
            <ModelCard key={m.id} m={m} d={d} locale={locale} />
          ))}
        </ul>
      </div>
    </section>
  );
}

export function FleetSection({ d, locale, site, surface = "slate" }: { d: Dict; locale: Locale; site: Site; surface?: Surface }) {
  return (
    <section id="fleet" className={`${bgOf(surface)} py-16 lg:py-24`}>
      <div className={wrap}>
        <div className="mb-10"><SplitTitle parts={d.fleet.title} /></div>
        <FleetGrid models={site.models} d={d} locale={locale} />
      </div>
    </section>
  );
}

const ICONS = [GraduationCap, HardHat, Fuel, BadgeCheck, Ruler, Shirt];

export function IncludedSection({ d, surface = "obsidian" }: { d: Dict; surface?: Surface }) {
  return (
    <section id="included" className={`overflow-hidden ${bgOf(surface)} py-16 lg:py-24`}>
      <div className={wrap}>
        <div className="mb-12"><SplitTitle parts={d.included.title} /></div>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-12 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-4">
          {d.included.items.map((it, i) => {
            const Icon = ICONS[i];
            const even = i % 2 === 0;
            return (
              <li key={it.t} className={`diamond-wrap flex flex-col items-center text-center ${!even ? "lg:mt-14" : ""}`}>
                <div className="relative grid h-[140px] place-items-center sm:h-[168px]">
                  <span
                    aria-hidden="true"
                    className={`absolute left-1/2 -translate-x-1/2 text-flame ${even ? "top-0" : "bottom-0"}`}
                  >
                    {even ? <ChevronUp size={18} strokeWidth={2.5} /> : <ChevronDown size={18} strokeWidth={2.5} />}
                  </span>
                  <div className="diamond !size-[84px] sm:!size-[108px]">
                    <Icon size={34} className="text-amber" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="h3 mt-2">{it.t}</h3>
                <p className="mt-2 max-w-[22ch] text-sm text-fg-2">{it.d}</p>
              </li>
            );
          })}
        </ul>
        <p className="mt-12 max-w-2xl border-t border-line pt-4 text-sm text-fg-3">{d.included.note}</p>
      </div>
    </section>
  );
}

export function PricesSection({ d, locale, site, surface = "obsidian" }: { d: Dict; locale: Locale; site: Site; surface?: Surface }) {
  const durations = [...new Set(site.models.flatMap((m) => m.rates.map((r) => r.duration_min)))].sort((a, b) => a - b);
  const dur = (min: number) => (min % 60 === 0 ? `${min / 60} ${d.common.hours}` : `${min} ${d.common.minutes}`);
  const promo = site.promo;
  return (
    <section id="prices" className={`${bgOf(surface)} py-16 lg:py-24`}>
      <div className={`${wrap} grid gap-12 lg:grid-cols-12`}>
        <div className="lg:col-span-8">
          <div className="mb-8"><SplitTitle parts={d.prices.title} /></div>
          <div className="overflow-hidden rounded-card border border-line bg-card">
            <table className="num w-full table-fixed text-left">
              <caption className="sr-only">{d.prices.title.join("")}</caption>
              <thead>
                <tr className="border-b border-line text-sm text-fg-2">
                  <th scope="col" className="w-[38%] px-3 py-3 font-semibold sm:w-1/2 sm:px-5">{d.prices.model}</th>
                  {durations.map((m) => (
                    <th key={m} scope="col" className="px-2.5 py-3 text-right font-semibold sm:px-5">{dur(m)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {site.models.map((m) => (
                  <tr key={m.id} className="border-b border-line last:border-0">
                    <th scope="row" className="px-3 py-4 text-sm font-semibold sm:px-5 sm:text-base">
                      {m.title[locale]}
                      {m.beginner && <span className="mt-1 block w-fit whitespace-nowrap rounded bg-flame px-1.5 py-0.5 font-display text-[0.7rem] uppercase tracking-wider text-ink sm:ml-2 sm:mt-0 sm:inline-block sm:align-middle">{d.fleet.beginner}</span>}
                    </th>
                    {durations.map((min) => {
                      const r = m.rates.find((x) => x.duration_min === min);
                      return (
                        <td key={min} className="px-2.5 py-4 text-right font-display text-lg font-semibold text-amber-text sm:px-5 sm:text-2xl">
                          {r ? r.amount_pln : "—"}
                          {r && <span className="ml-0.5 text-xs font-medium text-fg-3">{d.common.zl}</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-fg-3">{d.prices.note}</p>
        </div>
        <div className="lg:col-span-4">
          <h3 className="h3 mb-4">{d.prices.addons}</h3>
          <ul className="divide-y divide-line border-y border-line">
            {site.addons.map((a) => (
              <li key={a.id} className="flex items-baseline justify-between gap-4 py-3">
                <span>{a.title[locale]}</span>
                <span className="num whitespace-nowrap font-display text-xl font-semibold text-amber-text">
                  {a.amount_pln === 0 ? d.prices.included : (
                    <>
                      +{a.amount_pln} <span className="text-sm font-medium text-fg-2">{a.pricing_mode === "per_hour" ? d.common.perHour : `${d.common.zl} ${d.prices.flat}`}</span>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-12">
          <div className="mb-6"><SplitTitle parts={d.prices.formatsTitle} /></div>
          <div className="grid gap-6 md:grid-cols-2">
            {d.prices.formats.map((fmt) => (
              <div key={fmt.title} className="rounded-card border border-line bg-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="h3">{fmt.title}</h3>
                  <span className="rounded bg-flame px-2.5 py-0.5 font-display text-xs font-semibold uppercase tracking-wider text-ink">{fmt.badge}</span>
                </div>
                <ul className="mt-4 space-y-2.5 text-sm text-fg-2">
                  {fmt.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5">
                      <Check size={16} className="mt-0.5 shrink-0 text-amber-text" aria-hidden="true" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {promo.enabled && (promo.title[locale] || promo.body[locale]) && (
          <div className="cut-sm border border-amber/60 bg-card p-6 sm:p-8 lg:col-span-12">
            <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <h3 className="display text-2xl sm:text-3xl">{promo.title[locale]}</h3>
                <p className="mt-3 max-w-3xl text-fg-2">{promo.body[locale]}</p>
              </div>
              <a href={formatPhoneHref(site.contact.phone)} className="btn btn-amber"><Phone size={18} aria-hidden="true" />{site.contact.phone}</a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function HowSection({ d, surface = "slate" }: { d: Dict; surface?: Surface }) {
  return (
    <section id="how" className={`${bgOf(surface)} py-16 lg:py-24`}>
      <div className={wrap}>
        <div className="mb-12"><SplitTitle parts={d.how.title} /></div>
        <ol className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {d.how.steps.map((s, i) => (
            <li key={s.t} className="relative">
              <span aria-hidden="true" className="num block font-display text-7xl font-bold leading-none text-transparent [-webkit-text-stroke:2px_var(--color-amber-text)]">{i + 1}</span>
              <h3 className="h3 mt-3">{s.t}</h3>
              <p className="mt-2 max-w-[32ch] text-fg-2">{s.d}</p>
            </li>
          ))}
        </ol>
        <Link href="/booking" className="btn btn-amber mt-12">
          {d.how.cta}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

export function CityScheduleCards({ d, locale, site }: { d: Dict; locale: Locale; site: Site }) {
  return (
    <ul className="grid gap-6 md:grid-cols-2">
      {site.locations.map((l) => {
        const open = l.schedules.filter((s) => s.is_open);
        const hours = [...new Set(open.map((s) => `${s.open_time}–${s.close_time}`))].join(", ");
        return (
          <li key={l.id} className="rounded-card border border-line bg-card p-6 sm:p-8">
            <h3 className="display flex items-center gap-3 text-4xl"><MapPin className="text-amber-text" size={30} aria-hidden="true" />{l.city[locale]}</h3>
            <dl className="mt-6 space-y-4">
              <div>
                <dt className="text-sm font-semibold text-fg-3">{d.locations.days}</dt>
                <dd className="mt-0.5 text-lg">{open.length ? formatDays(open.map((s) => s.weekday), locale) : d.locations.closedAll}</dd>
              </div>
              {hours && (
                <div>
                  <dt className="flex items-center gap-1.5 text-sm font-semibold text-fg-3"><Clock size={14} aria-hidden="true" />{d.locations.hours}</dt>
                  <dd className="num mt-0.5 text-lg">{hours}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-semibold text-fg-3">{d.locations.address}</dt>
                <dd className="mt-0.5 text-fg-2">{l.address[locale]}</dd>
              </div>
              {l.slug === "wroclaw" && (
                <div>
                  <dt className="text-sm font-semibold text-fg-3">{d.locations.terrainsTitle}</dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {d.locations.terrains.map((t) => (
                      <span key={t} className="rounded border border-line px-2.5 py-1 text-sm text-fg-2">{t}</span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </li>
        );
      })}
    </ul>
  );
}

export function LocationsTeaser({ d, locale, site, surface = "slate" }: { d: Dict; locale: Locale; site: Site; surface?: Surface }) {
  return (
    <section id="locations" className={`${bgOf(surface)} py-16 lg:py-24`}>
      <div className={wrap}>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <SplitTitle parts={d.locations.title} />
          <Link href="/locations" className="btn btn-ghost">
            {d.home.locationsAll}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <CityScheduleCards d={d} locale={locale} site={site} />
      </div>
    </section>
  );
}

export function LocationsScheduleSection({ d, locale, site, surface = "slate" }: { d: Dict; locale: Locale; site: Site; surface?: Surface }) {
  return (
    <section id="locations" className={`${bgOf(surface)} py-16 lg:py-24`}>
      <div className={wrap}>
        <div className="mb-10"><SplitTitle parts={d.locations.title} /></div>
        <CityScheduleCards d={d} locale={locale} site={site} />
      </div>
    </section>
  );
}

export function TerrainCardsGrid({ d }: { d: Dict }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {d.locations.terrainCards.map((c) => (
        <li key={c.title} className="flex flex-col overflow-hidden rounded-card border border-line bg-card">
          <div className="relative aspect-[4/3] bg-card-2">
            <Image src={c.img} alt={c.title} fill sizes="(min-width:1024px) 22vw, 48vw" className="object-cover" />
          </div>
          <div className="flex flex-1 flex-col p-4">
            <h3 className="h3">{c.title}</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-amber-text">{c.place}</p>
            <p className="mt-2 text-sm text-fg-2">{c.desc}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function LocationsTerrainsSection({ d, locale, surface = "obsidian" }: { d: Dict; locale: Locale; surface?: Surface }) {
  return (
    <section id="terrains" className={`${bgOf(surface)} py-16 lg:py-24`}>
      <div className={`${wrap} space-y-14`}>
        <div>
          <div className="mb-8"><SplitTitle parts={d.locations.cardsTitle} /></div>
          <TerrainCardsGrid d={d} />
        </div>
        <RegionMap d={d} locale={locale} />
      </div>
    </section>
  );
}

export function GallerySection({ d, locale, site, surface = "slate" }: { d: Dict; locale: Locale; site: Site; surface?: Surface }) {
  return (
    <section id="photos" className={`${bgOf(surface)} py-16 lg:py-24`}>
      <div className={wrap}>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <SplitTitle parts={d.gallery.title} />
          {site.contact.instagramUrl && (
            <a href={site.contact.instagramUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost max-w-full !whitespace-normal py-2.5 text-center leading-tight">
              <Instagram size={18} className="shrink-0" aria-hidden="true" />
              <span>{d.gallery.more}</span>
            </a>
          )}
        </div>
        <GalleryGrid items={site.gallery} d={d} locale={locale} />
      </div>
    </section>
  );
}

function ReviewCards({ d, items }: { d: Dict; items: Dict["reviews"]["items"] }) {
  return (
    <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((r) => (
        <li key={r.by} className="flex flex-col justify-between rounded-card border border-line bg-card p-6">
          <div>
            <Quote size={28} className="text-amber-text" aria-hidden="true" />
            <blockquote className="mt-3 text-base leading-relaxed text-fg">{r.q}</blockquote>
          </div>
          <div className="mt-6 flex items-center gap-3 border-t border-line pt-4">
            <div className="relative size-11 shrink-0 overflow-hidden rounded-full border border-amber-text/60">
              <Image src={r.avatar} alt={r.by} fill sizes="44px" className="object-cover object-top" />
            </div>
            <div>
              <p className="font-display text-base font-semibold uppercase tracking-wide text-amber-text">{r.by}</p>
              <p className="text-xs text-fg-3">{d.reviews.source}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ReviewsSection({ d, surface = "obsidian" }: { d: Dict; surface?: Surface }) {
  return (
    <section className={`${bgOf(surface)} py-16 lg:py-24`} aria-labelledby="reviews-title">
      <div className={`${wrap} space-y-12`}>
        <div id="reviews-title"><SplitTitle parts={d.reviews.title} /></div>
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {d.reviews.stats.map((st) => (
            <li key={st.label} className="rounded-card border border-line bg-card p-5 text-center">
              <p className="num font-display text-3xl font-bold text-amber-text sm:text-4xl">{st.value}</p>
              <p className="mt-1 text-sm text-fg-2">{st.label}</p>
            </li>
          ))}
        </ul>
        <ReviewCards d={d} items={d.reviews.items} />
      </div>
    </section>
  );
}

export function TrustTeaser({ d, surface = "obsidian" }: { d: Dict; surface?: Surface }) {
  return (
    <section className={`${bgOf(surface)} py-16 lg:py-24`} aria-labelledby="trust-title">
      <div className={`${wrap} space-y-12`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div id="trust-title"><SplitTitle parts={d.reviews.title} /></div>
          <Link href="/gallery" className="btn btn-ghost">
            {d.home.galleryAll}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {d.reviews.stats.map((st) => (
            <li key={st.label} className="rounded-card border border-line bg-card p-5 text-center">
              <p className="num font-display text-3xl font-bold text-amber-text sm:text-4xl">{st.value}</p>
              <p className="mt-1 text-sm text-fg-2">{st.label}</p>
            </li>
          ))}
        </ul>
        <ReviewCards d={d} items={d.reviews.items.slice(0, 3)} />
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/booking" className="btn btn-amber">
            {d.common.book}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link href="/gallery" className="btn btn-ghost">
            {d.home.galleryAll}
          </Link>
          <Link href="/contact" className="btn btn-ghost">
            {d.home.contactLink}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ d, surface = "obsidian" }: { d: Dict; surface?: Surface }) {
  return (
    <section id="faq" className={`${bgOf(surface)} py-16 lg:py-24`}>
      <div className={wrap}>
        <div className="mb-10"><SplitTitle parts={d.faq.title} /></div>
        <div className="max-w-4xl space-y-3">
          {d.faq.items.map((item) => (
            <details key={item.q} className="group rounded-card border border-line bg-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-display text-lg font-semibold uppercase tracking-wide text-fg transition-colors hover:text-amber-text [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <ChevronDown size={20} className="shrink-0 text-amber-text transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="border-t border-line px-5 py-4 text-fg-2">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactSection({ d, site, surface = "slate" }: { d: Dict; site: Site; surface?: Surface }) {
  const c = site.contact;
  return (
    <section id="contacts" className={`${bgOf(surface)} py-16 lg:py-24`}>
      <div className={`${wrap} grid items-center gap-10 lg:grid-cols-2`}>
        <div>
          <SplitTitle parts={d.contact.title} />
          <p className="mt-5 max-w-lg text-lg text-fg-2">{d.contact.text}</p>
        </div>
        <div className="space-y-4">
          <a href={formatPhoneHref(c.phone)} className="num flex items-center gap-4 font-display text-4xl font-bold tracking-wide text-amber-text transition-colors hover:text-amber sm:text-5xl">
            <Phone size={36} aria-hidden="true" /> {c.phone}
          </a>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/booking" className="btn btn-amber">{d.common.book}</Link>
            {c.instagramUrl && <a href={c.instagramUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><Instagram size={18} aria-hidden="true" />{d.common.instagram}</a>}
            {c.telegramUrl && <a href={c.telegramUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><Send size={18} aria-hidden="true" />{d.common.telegram}</a>}
            {c.facebookUrl && <a href={c.facebookUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><Facebook size={18} aria-hidden="true" />{d.common.facebook}</a>}
            {c.email && <a href={`mailto:${c.email}`} className="btn btn-ghost"><Mail size={18} aria-hidden="true" />{c.email}</a>}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter({ d, locale, site }: { d: Dict; locale: Locale; site: Site }) {
  const links: [string, string][] = [
    ["/fleet", d.nav.fleet],
    ["/locations", d.nav.locations],
    ["/gallery", d.nav.gallery],
    ["/contact", d.nav.contacts],
    ["/booking", d.common.book],
    ["/privacy", d.common.privacy],
  ];
  return (
    <footer className="border-t border-line bg-card py-10">
      <div className={`${wrap} flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between`}>
        <div>
          <Wordmark size="lg" />
          <p className="mt-3 max-w-sm text-sm text-fg-3">{d.footer.note}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-fg-2">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="transition-colors hover:text-amber">{label}</Link>
          ))}
          <a href={formatPhoneHref(site.contact.phone)} className="num font-semibold text-fg transition-colors hover:text-amber">{site.contact.phone}</a>
          <LangSwitch locale={locale} label={d.common.langLabel} />
        </div>
      </div>
      <p className={`${wrap} mt-6 text-xs text-fg-3`}>© {new Date().getFullYear()} MOTOCROSS WRO. {d.footer.rights}</p>
    </footer>
  );
}
