import type { Metadata, Viewport } from "next";
import { getLocale, getDict } from "@/shared/i18n/server";
import { HTML_LANG } from "@/shared/i18n/config";
import "./fonts.css";
import "./globals.css";

export const viewport: Viewport = { themeColor: "#1c1d21", width: "device-width", initialScale: 1 };

export async function generateMetadata(): Promise<Metadata> {
  const d = getDict(await getLocale());
  const base = process.env.SITE_URL ?? process.env.URL ?? "http://localhost:3000";
  return {
    metadataBase: new URL(base),
    title: d.meta.title,
    description: d.meta.description,
    openGraph: { title: d.meta.title, description: d.meta.description, type: "website", images: ["/media/client/quads-terrain.webp"] },
    alternates: { canonical: "/", languages: { pl: "/?lang=pl", uk: "/?lang=uk", ru: "/?lang=ru", "x-default": "/" } },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={HTML_LANG[locale]}>
      <body>{children}</body>
    </html>
  );
}

