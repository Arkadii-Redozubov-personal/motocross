import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getDict } from "@/shared/i18n/server";
import { loadSite } from "@/features/marketing/data";
import { PageShell } from "@/features/marketing/PageShell";
import { PageBanner } from "@/features/marketing/PageBanner";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const d = getDict(await getLocale());
  return { title: d.privacy.metaTitle, alternates: { canonical: "/privacy" } };
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const d = getDict(locale);
  const site = loadSite();
  return (
    <PageShell d={d} locale={locale} site={site}>
      <PageBanner
        title={d.privacy.title}
        lead={d.footer.note}
        image="/media/ig/quad-forest-ride.webp"
        imageAlt={d.privacy.metaTitle}
        imagePosition="50% 50%"
      />
      <section className="surface-light py-14 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="rounded-ctl border border-amber/60 bg-card p-4 text-sm text-fg-2">{d.privacy.draft}</p>
          <div className="mt-10 space-y-8">
            {d.privacy.sections.map((s) => (
              <section key={s.h}>
                <h2 className="h3 mb-2">{s.h}</h2>
                <p className="text-fg-2">{s.p}</p>
              </section>
            ))}
          </div>
          <Link href="/" className="btn btn-ghost mt-12">{d.common.back}</Link>
        </div>
      </section>
    </PageShell>
  );
}
