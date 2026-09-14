"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

export function LangToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const search = useSearchParams();

  function switchTo(next: "ar" | "en") {
    if (next === locale) return;
    const qs = search.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { locale: next });
  }

  return (
    <div
      className="fixed top-4 z-40 flex overflow-hidden rounded-full border border-ink-soft/30 bg-paper/85 text-[11px] shadow-sm backdrop-blur-sm ltr:left-4 rtl:right-4"
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => switchTo("en")}
        className={`min-w-11 px-3 py-2 font-medium tracking-widest transition-colors ${
          locale === "en" ? "bg-olive-700 text-cream" : "text-ink-soft"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchTo("ar")}
        className={`min-w-11 px-3 py-2 font-medium transition-colors ${
          locale === "ar" ? "bg-olive-700 text-cream" : "text-ink-soft"
        }`}
      >
        عربي
      </button>
    </div>
  );
}
