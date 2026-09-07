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
      className="fixed top-4 z-40 flex overflow-hidden rounded-full border border-cream/25 bg-olive-950/40 text-[11px] backdrop-blur-sm ltr:left-4 rtl:right-4"
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => switchTo("en")}
        className={`min-w-11 px-3 py-2 font-medium tracking-widest transition-colors ${
          locale === "en" ? "bg-cream text-olive-950" : "text-cream/80"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchTo("ar")}
        className={`min-w-11 px-3 py-2 font-medium transition-colors ${
          locale === "ar" ? "bg-cream text-olive-950" : "text-cream/80"
        }`}
      >
        عربي
      </button>
    </div>
  );
}
