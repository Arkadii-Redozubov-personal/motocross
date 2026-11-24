import { getLocale, getDict } from "@/shared/i18n/server";
import { loadSite } from "@/features/marketing/data";
import { PageShell } from "@/features/marketing/PageShell";
import { ContactStrip, Hero } from "@/features/marketing/Hero";
import { FleetTeaser, IncludedSection, LocationsTeaser, TrustTeaser } from "@/features/marketing/Sections";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = await getLocale();
  const d = getDict(locale);
  const site = loadSite();
  return (
    <PageShell d={d} locale={locale} site={site}>
      <Hero d={d} locale={locale} site={site} />
      <ContactStrip d={d} locale={locale} site={site} />
      <FleetTeaser d={d} locale={locale} site={site} surface="light" />
      <IncludedSection d={d} surface="obsidian" />
      <LocationsTeaser d={d} locale={locale} site={site} surface="light" />
      <TrustTeaser d={d} surface="obsidian" />
    </PageShell>
  );
}
