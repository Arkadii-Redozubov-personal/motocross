import type { ReactNode } from "react";
import type { Locale } from "@/shared/i18n/config";
import type { Dict } from "@/shared/i18n/dictionaries/pl";
import type { Site } from "./data";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./Sections";

export function PageShell({
  d,
  locale,
  site,
  mainClassName = "",
  children,
}: {
  d: Dict;
  locale: Locale;
  site: Site;
  mainClassName?: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader d={d} locale={locale} phone={site.contact.phone} instagramUrl={site.contact.instagramUrl} />
      <main id="main" className={mainClassName}>{children}</main>
      <SiteFooter d={d} locale={locale} site={site} />
    </>
  );
}

