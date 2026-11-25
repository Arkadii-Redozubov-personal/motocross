import type { Metadata } from "next";
import { getLocale, getDict } from "@/shared/i18n/server";
import { loadSite } from "@/features/marketing/data";
import { PageShell } from "@/features/marketing/PageShell";
import { PageBanner } from "@/features/marketing/PageBanner";
import { LocationsScheduleSection, LocationsTerrainsSection } from "@/features/marketing/Sections";
import { CtaBand } from "@/features/marketing/CtaBand";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const d = getDict(await getLocale());
  return {
    title: d.pages.locations.metaTitle,
    description: d.pages.locations.metaDesc,
    alternates: { canonical: "/locations" },
  };
}

export default async function LocationsPage() {
  const locale = await getLocale();
  const d = getDict(locale);
  const site = loadSite();
  return (
    <PageShell d={d} locale={locale} site={site}>
      <PageBanner
        title={d.pages.locations.title}
        lead={d.pages.locations.lead}
        ctaHref="/booking"
        ctaLabel={d.common.book}
        image="/media/ig/quarry-4-riders.webp"
        imageAlt={d.pages.locations.metaTitle}
        imagePosition="50% 45%"
      />
      <LocationsScheduleSection d={d} locale={locale} site={site} surface="light" />
      <LocationsTerrainsSection d={d} locale={locale} surface="obsidian" />
      <CtaBand d={d} locale={locale} site={site} />
    </PageShell>
  );
}

