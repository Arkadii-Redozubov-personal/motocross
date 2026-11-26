"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Clock, Instagram, MapPin, Menu, Phone, X } from "lucide-react";
import { Wordmark, formatPhoneHref } from "./ui";
import { LangSwitch } from "./LangSwitch";
import type { Locale } from "@/shared/i18n/config";
import type { Dict } from "@/shared/i18n/dictionaries/pl";

export function SiteHeader({ d, locale, phone, instagramUrl }: { d: Dict; locale: Locale; phone: string; instagramUrl?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";
  const links: [string, string][] = [
    ["/fleet", d.nav.fleet],
    ["/locations", d.nav.locations],
    ["/gallery", d.nav.gallery],
    ["/contact", d.nav.contacts],
  ];
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-obsidian">
      <div className="hidden border-b border-line bg-[#151619] text-xs text-fg-2 md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <a href={formatPhoneHref(phone)} className="num flex items-center gap-1.5 font-semibold text-fg transition-colors hover:text-amber">
              <Phone size={13} className="text-amber" aria-hidden="true" />
              {phone}
            </a>
            <span className="num flex items-center gap-1.5">
              <Clock size={13} className="text-amber" aria-hidden="true" />
              {d.utility.hours}
            </span>
            <span className="hidden items-center gap-1.5 lg:flex">
              <MapPin size={13} className="text-amber" aria-hidden="true" />
              {d.utility.schedule}
            </span>
          </div>
          {instagramUrl && (
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-medium text-fg-2 transition-colors hover:text-amber">
              <Instagram size={13} className="text-amber" aria-hidden="true" />
              @motocross.wro
            </a>
          )}
        </div>
      </div>
      <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-2 px-3 sm:h-[72px] sm:gap-3 sm:px-6 lg:gap-4">
        <Link href="/" className="shrink-0 py-1" aria-label="MOTOCROSS WRO">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="ml-2 hidden flex-1 items-center gap-4 2xl:gap-6 xl:flex">
          {links.map(([href, label]) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap font-display text-[0.95rem] font-medium uppercase tracking-wider transition-colors ${
                  active
                    ? "text-amber underline decoration-amber decoration-2 underline-offset-[10px]"
                    : "text-fg-2 hover:text-amber"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <LangSwitch locale={locale} label={d.common.langLabel} />
          </div>
          <a href={formatPhoneHref(phone)} className="num hidden shrink-0 whitespace-nowrap items-center gap-2 font-display text-lg font-semibold tracking-wide text-fg transition-colors hover:text-amber lg:flex">
            <Phone size={18} aria-hidden="true" />
            {phone}
          </a>
          <Link href="/booking" className="btn btn-amber !min-h-10 !px-3 text-sm sm:!min-h-11 sm:!px-6 sm:text-base">
            {d.common.book}
          </Link>
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-ctl border border-line sm:size-11 xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? d.common.close : d.common.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line bg-slate-deep xl:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between border-b border-line px-4 py-3 sm:hidden">
            <span className="text-sm font-semibold text-fg-2">{d.common.langLabel}</span>
            <LangSwitch locale={locale} label={d.common.langLabel} />
          </div>
          <ul className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
            {links.map(([href, label]) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`block border-b border-line py-3.5 font-display text-lg font-medium uppercase tracking-wider ${
                      active ? "text-amber" : "text-fg"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
            <li>
              <a href={formatPhoneHref(phone)} className="num flex items-center gap-2 py-3.5 font-display text-lg font-semibold text-amber">
                <Phone size={18} aria-hidden="true" /> {phone}
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
