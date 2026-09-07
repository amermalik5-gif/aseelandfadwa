"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { localizeNumber } from "@/lib/dates";

function remaining(target: number) {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1_000) % 60,
  };
}

export function Countdown({ targetMs }: { targetMs: number }) {
  const t = useTranslations("countdown");
  const locale = useLocale();
  // Render zeros on the server, hydrate with the live value to avoid mismatch
  const [now, setNow] = useState<ReturnType<typeof remaining> | null>(null);

  useEffect(() => {
    setNow(remaining(targetMs));
    const id = setInterval(() => setNow(remaining(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const units = [
    ["days", now?.days ?? 0],
    ["hours", now?.hours ?? 0],
    ["minutes", now?.minutes ?? 0],
    ["seconds", now?.seconds ?? 0],
  ] as const;

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-6">
      {units.map(([key, value]) => (
        <div key={key} className="flex flex-col items-center gap-1.5">
          <span
            className="type-display min-w-[2ch] text-center text-4xl tabular-nums text-ink sm:text-5xl"
            aria-hidden={now === null}
          >
            {localizeNumber(locale, value)}
          </span>
          <span className="tracked text-[10px] text-ink-soft sm:text-xs">
            {t(key)}
          </span>
        </div>
      ))}
    </div>
  );
}
