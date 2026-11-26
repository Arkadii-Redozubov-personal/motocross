import type { Metadata } from "next";
import { getLocale, getDict } from "@/shared/i18n/server";
import { loadSite } from "@/features/marketing/data";
import { PageShell } from "@/features/marketing/PageShell";
import { PageBanner } from "@/features/marketing/PageBanner";
import { ContactSection, FaqSection, HowSection } from "@/features/marketing/Sections";
import { CtaBand } from "@/features/marketing/CtaBand";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const d = getDict(await getLocale());
  return {
    title: d.pages.contact.metaTitle,
    description: d.pages.contact.metaDesc,
    alternates: { canonical: "/contact" },
  };
}

export default async function ContactPage() {
  const locale = await getLocale();
  const d = getDict(locale);
  const site = loadSite();
  return (
    <PageShell d={d} locale={locale} site={site}>
      <PageBanner
        title={d.pages.contact.title}
        lead={d.pages.contact.lead}
        ctaHref="/booking"
        ctaLabel={d.common.book}
        image="/media/ig/moto-sunset-track.webp"
        imageAlt={d.pages.contact.metaTitle}
        imagePosition="50% 50%"
      />
      <HowSection d={d} surface="light" />
      <FaqSection d={d} surface="paper" />
      <ContactSection d={d} site={site} surface="obsidian" />
      <CtaBand d={d} locale={locale} site={site} />
    </PageShell>
  );
}

