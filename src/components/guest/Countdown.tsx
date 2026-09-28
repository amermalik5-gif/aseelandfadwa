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

  // Explicit LTR: days sit on the left, seconds on the right (clock order).
  // Each unit is its own box so the digits never run together into one number.
  return (
    <div dir="ltr" className="grid w-full max-w-sm grid-cols-4 gap-2.5 sm:gap-4">
      {units.map(([key, value]) => (
        <div
          key={key}
          className="flex flex-col items-center gap-1 border border-beige-400/70 bg-paper/60 px-1 py-3"
        >
          <span
            className="type-display text-center text-4xl leading-none tabular-nums text-ink sm:text-5xl"
            style={{ unicodeBidi: "isolate" }}
            aria-hidden={now === null}
          >
            {localizeNumber(locale, value)}
          </span>
          <span className="text-base text-ink-soft">{t(key)}</span>
        </div>
      ))}
    </div>
  );
}
