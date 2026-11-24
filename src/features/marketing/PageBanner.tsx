import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Contours, SplitTitle } from "./ui";

export function PageBanner({
  title,
  lead,
  ctaHref,
  ctaLabel,
  secondaryHref,
  secondaryLabel,
  secondaryExternal = false,
  image,
  imageAlt = "",
  imagePosition = "50% 50%",
}: {
  title: string[];
  lead: string;
  ctaHref?: string;
  ctaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  secondaryExternal?: boolean;
  image?: string;
  imageAlt?: string;
  imagePosition?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-obsidian py-16 lg:py-24">
      {image ? (
        <>
          <Image
            src={image}
            alt={imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: imagePosition }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#141518]/92 via-[#1c1d21]/78 to-[#1c1d21]/45" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1c1d21]/85 via-transparent to-[#1c1d21]/35" aria-hidden="true" />
        </>
      ) : (
        <Contours className="pointer-events-none absolute -right-1/4 -top-1/2 h-[180%] w-[120%] text-amber opacity-[0.1]" seed={4} />
      )}
      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <SplitTitle as="h1" className="h2" parts={title} />
          <p className="mt-4 max-w-2xl text-lg text-fg-2">{lead}</p>
        </div>
        {(ctaHref || secondaryHref) && (
          <div className="flex flex-wrap gap-3">
            {ctaHref && ctaLabel && (
              <Link href={ctaHref} className="btn btn-amber">
                {ctaLabel}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            )}
            {secondaryHref && secondaryLabel && (
              secondaryExternal ? (
                <a href={secondaryHref} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                  {secondaryLabel}
                </a>
              ) : (
                <Link href={secondaryHref} className="btn btn-ghost">
                  {secondaryLabel}
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}
