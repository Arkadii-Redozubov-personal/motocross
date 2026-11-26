import type { Metadata } from "next";
import { getLocale, getDict } from "@/shared/i18n/server";
import { loadSite } from "@/features/marketing/data";
import { PageShell } from "@/features/marketing/PageShell";
import { PageBanner } from "@/features/marketing/PageBanner";
import { FleetSection, PricesSection } from "@/features/marketing/Sections";
import { CtaBand } from "@/features/marketing/CtaBand";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const d = getDict(await getLocale());
  return {
    title: d.pages.fleet.metaTitle,
    description: d.pages.fleet.metaDesc,
    alternates: { canonical: "/fleet" },
  };
}

export default async function FleetPage() {
  const locale = await getLocale();
  const d = getDict(locale);
  const site = loadSite();
  return (
    <PageShell d={d} locale={locale} site={site}>
      <PageBanner
        title={d.pages.fleet.title}
        lead={d.pages.fleet.lead}
        ctaHref="/booking"
        ctaLabel={d.common.book}
        image="/media/ig/hero-fleet-lineup.webp"
        imageAlt={d.pages.fleet.metaTitle}
        imagePosition="50% 55%"
      />
      <FleetSection d={d} locale={locale} site={site} surface="light" />
      <PricesSection d={d} locale={locale} site={site} surface="obsidian" />
      <CtaBand d={d} locale={locale} site={site} />
    </PageShell>
  );
}

