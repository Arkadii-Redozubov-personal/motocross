import type { MetadataRoute } from "next";

const ROUTES: [string, number][] = [
  ["/", 1],
  ["/fleet", 0.85],
  ["/locations", 0.85],
  ["/gallery", 0.85],
  ["/contact", 0.85],
  ["/booking", 0.8],
  ["/privacy", 0.5],
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL ?? process.env.URL ?? "http://localhost:3000";
  const langs = (p: string) => ({ languages: { pl: `${base}${p}?lang=pl`, uk: `${base}${p}?lang=uk`, ru: `${base}${p}?lang=ru` } });
  return ROUTES.map(([p, priority]) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly" as const,
    priority,
    alternates: langs(p),
  }));
}
