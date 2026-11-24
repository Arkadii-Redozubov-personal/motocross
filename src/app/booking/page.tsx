import type { Metadata } from "next";
import { getLocale, getDict } from "@/shared/i18n/server";
import { loadSite } from "@/features/marketing/data";
import { PageShell } from "@/features/marketing/PageShell";
import { PageBanner } from "@/features/marketing/PageBanner";
import { BookingWizard, type Initial } from "@/features/booking/BookingWizard";
import { isValidYmd, todayWarsawYmd } from "@/shared/lib/time";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const d = getDict(await getLocale());
  return { title: d.booking.metaTitle, alternates: { canonical: "/booking" } };
}

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function BookingPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const locale = await getLocale();
  const d = getDict(locale);
  const site = loadSite();
  const today = todayWarsawYmd();

  const date = first(sp.date);
  const model = site.models.find((m) => m.slug === first(sp.model));
  const cat = first(sp.category);
  const initial: Initial = {
    date: isValidYmd(date) && date >= today ? date : "",
    category: model ? model.category : cat === "quad" || cat === "moto" ? cat : "",
    model: model?.slug ?? "",
    qty: Math.min(20, Math.max(1, Number(first(sp.qty)) || 1)),
    dur: Number(first(sp.dur)) || 0,
    slot: /^\d{2}:\d{2}$/.test(first(sp.slot)) ? first(sp.slot) : "",
    addons: first(sp.addons).split(",").filter((a) => site.addons.some((x) => x.slug === a)),
  };

  return (
    <PageShell d={d} locale={locale} site={site}>
      <PageBanner
        title={d.booking.title}
        lead={d.booking.lead}
        image="/media/ig/asix-88-profile.jpg"
        imageAlt={d.hero.imgAlt2}
        imagePosition="50% 55%"
      />
      <section className="bg-obsidian py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <BookingWizard d={d} locale={locale} models={site.models} addons={site.addons} locations={site.locations} today={today} initial={initial} phone={site.contact.phone} />
        </div>
      </section>
    </PageShell>
  );
}
