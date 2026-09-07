import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import {
  Marcellus,
  Great_Vibes,
  Amiri,
  Aref_Ruqaa,
  Tajawal,
} from "next/font/google";
import { routing } from "@/i18n/routing";
import "../globals.css";

const marcellus = Marcellus({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-marcellus",
});
const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-great-vibes",
});
const amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-amiri",
});
const arefRuqaa = Aref_Ruqaa({
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-aref-ruqaa",
});
const tajawal = Tajawal({
  weight: ["300", "400", "500", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-tajawal",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("title"), description: t("description") };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${marcellus.variable} ${greatVibes.variable} ${amiri.variable} ${arefRuqaa.variable} ${tajawal.variable} antialiased`}
    >
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
