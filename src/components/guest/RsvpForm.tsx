"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { localizeNumber } from "@/lib/dates";

type Existing = {
  attending: boolean;
  guestCount: number | null;
  mobile: string | null;
} | null;

export function RsvpForm({
  code,
  maxGuests,
  existing,
  closed,
}: {
  code: string;
  maxGuests: number;
  existing: Existing;
  closed: boolean;
}) {
  const t = useTranslations("rsvp");
  const locale = useLocale();

  const [saved, setSaved] = useState<Existing>(existing);
  const [editing, setEditing] = useState(false);

  const [attending, setAttending] = useState<boolean | null>(
    existing ? existing.attending : null
  );
  const [count, setCount] = useState<number>(
    existing?.guestCount ?? maxGuests
  );
  const [mobile, setMobile] = useState(existing?.mobile ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const showSummary = saved !== null && !editing;

  function validMobile(value: string) {
    if (!value.trim()) return true;
    return /^[+\d][\d\s-]{6,16}$/.test(value.trim());
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (attending === null) {
      setError(t("chooseAnswer"));
      return;
    }
    if (!validMobile(mobile)) {
      setError(t("mobileInvalid"));
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          attending,
          guestCount: attending ? count : 0,
          mobile: mobile.trim() || null,
          locale,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved({
        attending,
        guestCount: attending ? count : 0,
        mobile: mobile.trim() || null,
      });
      setEditing(false);
    } catch {
      setError(t("error"));
    } finally {
      setBusy(false);
    }
  }

  if (closed && !showSummary) {
    return (
      <p className="mx-auto max-w-md text-center text-base leading-relaxed text-ink-soft">
        {t("closed")}
      </p>
    );
  }

  if (showSummary && saved) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <p className="text-lg leading-relaxed text-ink">
          {saved.attending ? t("thanksYes") : t("thanksNo")}
        </p>
        {saved.attending && (
          <p className="text-sm text-ink-soft">
            {t("countLabel")}: {localizeNumber(locale, saved.guestCount ?? maxGuests)}
          </p>
        )}
        {!closed && (
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setAttending(saved.attending);
              setCount(saved.guestCount ?? maxGuests);
              setMobile(saved.mobile ?? "");
            }}
            className="tracked border-b border-brass pb-0.5 text-xs text-ink-soft transition-colors hover:text-ink"
          >
            {t("edit")}
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-md flex-col gap-8">
      {/* attendance choice: reply-card style */}
      <div className="flex flex-col gap-3" role="radiogroup" aria-label={t("title")}>
        <button
          type="button"
          role="radio"
          aria-checked={attending === true}
          onClick={() => setAttending(true)}
          className={`min-h-12 border px-4 py-3 text-sm transition-colors ${
            attending === true
              ? "border-olive-700 bg-olive-700 text-cream"
              : "border-olive-700/40 bg-transparent text-ink hover:border-olive-700"
          }`}
        >
          {t("yes")}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={attending === false}
          onClick={() => setAttending(false)}
          className={`min-h-12 border px-4 py-3 text-sm transition-colors ${
            attending === false
              ? "border-olive-700 bg-olive-700 text-cream"
              : "border-olive-700/40 bg-transparent text-ink hover:border-olive-700"
          }`}
        >
          {t("no")}
        </button>
      </div>

      {attending === true && maxGuests > 1 && (
        <div className="flex flex-col items-center gap-3">
          <span className="tracked text-[11px] text-ink-soft">
            {t("countLabel")}
          </span>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setCount((c) => Math.max(1, c - 1))}
              disabled={count <= 1}
              aria-label={t("countLess")}
              className="flex size-12 items-center justify-center border border-olive-700/40 text-xl text-ink transition-colors hover:border-olive-700 disabled:opacity-30"
            >
              −
            </button>
            <span className="type-display min-w-[2ch] text-center text-4xl tabular-nums text-ink">
              {localizeNumber(locale, count)}
            </span>
            <button
              type="button"
              onClick={() => setCount((c) => Math.min(maxGuests, c + 1))}
              disabled={count >= maxGuests}
              aria-label={t("countMore")}
              className="flex size-12 items-center justify-center border border-olive-700/40 text-xl text-ink transition-colors hover:border-olive-700 disabled:opacity-30"
            >
              +
            </button>
          </div>
          <span className="text-xs text-ink-soft">
            {t("allowance", {
              count: maxGuests,
              countDisplay: localizeNumber(locale, maxGuests),
            })}
          </span>
        </div>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="tracked text-[11px] text-ink-soft">
          {t("mobile")}{" "}
          <span className="normal-case tracking-normal opacity-70">
            ({t("optional")})
          </span>
        </span>
        <input
          type="tel"
          inputMode="tel"
          dir="ltr"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          placeholder="07XXXXXXXX"
          className="input-line rtl:text-right"
          autoComplete="tel"
        />
      </label>

      {error && (
        <p role="alert" className="text-center text-sm text-clay">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="tracked min-h-13 w-full bg-olive-700 px-6 py-4 text-sm text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? t("sending") : t("confirm")}
      </button>
    </form>
  );
}
