import Link from "next/link";
import { CalendarDays, MapPin, Phone } from "lucide-react";
import { formatDays, type Locale } from "@/shared/i18n/config";
import type { Dict } from "@/shared/i18n/dictionaries/pl";
import type { Site } from "./data";
import { formatPhoneHref } from "./ui";

export function CtaBand({ d, locale, site }: { d: Dict; locale: Locale; site: Site }) {
  const where = site.locations
    .map((l) => {
      const days = l.schedules.filter((s) => s.is_open).map((s) => s.weekday);
      return days.length ? `${l.city[locale]}: ${formatDays(days, locale)}` : null;
    })
    .filter(Boolean);
  return (
    <div className="bg-amber text-ink">
      <div className="mx-auto grid max-w-7xl items-center gap-4 px-4 py-5 sm:px-6 md:grid-cols-[auto_1fr_auto] md:gap-10">
        <a href={formatPhoneHref(site.contact.phone)} className="flex items-center gap-3">
          <Phone size={28} aria-hidden="true" />
          <span>
            <span className="block text-sm font-semibold">{d.strip.cta}</span>
            <span className="num block font-display text-3xl font-bold leading-none tracking-wide">{site.contact.phone}</span>
          </span>
        </a>
        <p className="flex items-start gap-3 text-[0.95rem] font-medium md:justify-center">
          <MapPin size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{where.join("  ·  ")}</span>
        </p>
        <Link href="/booking" className="btn btn-dark">
          <CalendarDays size={18} aria-hidden="true" />
          {d.common.book}
        </Link>
      </div>
    </div>
  );
}

