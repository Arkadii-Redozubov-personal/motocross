import type { Metadata } from "next";
import { getLocale, getDict } from "@/shared/i18n/server";
import { loadSite } from "@/features/marketing/data";
import { PageShell } from "@/features/marketing/PageShell";
import { PageBanner } from "@/features/marketing/PageBanner";
import { GallerySection, ReviewsSection } from "@/features/marketing/Sections";
import { CtaBand } from "@/features/marketing/CtaBand";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const d = getDict(await getLocale());
  return {
    title: d.pages.gallery.metaTitle,
    description: d.pages.gallery.metaDesc,
    alternates: { canonical: "/gallery" },
  };
}

export default async function GalleryPage() {
  const locale = await getLocale();
  const d = getDict(locale);
  const site = loadSite();
  return (
    <PageShell d={d} locale={locale} site={site}>
      <PageBanner
        title={d.pages.gallery.title}
        lead={d.pages.gallery.lead}
        ctaHref="/booking"
        ctaLabel={d.common.book}
        secondaryHref={site.contact.instagramUrl || undefined}
        secondaryLabel={d.common.instagram}
        secondaryExternal
        image="/media/ig/rider-raven-helmet.webp"
        imageAlt={d.pages.gallery.metaTitle}
        imagePosition="50% 35%"
      />
      <GallerySection d={d} locale={locale} site={site} surface="slate" />
      <ReviewsSection d={d} surface="light" />
      <CtaBand d={d} locale={locale} site={site} />
    </PageShell>
  );
}

