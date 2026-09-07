"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type Existing = {
  attending: boolean;
  guestNames: string[];
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
  const [names, setNames] = useState<string[]>(
    existing?.guestNames.length ? existing.guestNames : [""]
  );
  const [mobile, setMobile] = useState(existing?.mobile ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const showSummary = saved !== null && !editing;

  function setName(i: number, value: string) {
    setNames((prev) => prev.map((n, idx) => (idx === i ? value : n)));
  }

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
    const cleaned = names.map((n) => n.trim()).filter(Boolean);
    if (attending && (cleaned.length === 0 || cleaned.length < names.length)) {
      setError(t("nameRequired"));
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
          guestNames: attending ? cleaned : [],
          mobile: mobile.trim() || null,
          locale,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved({
        attending,
        guestNames: attending ? cleaned : [],
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
        {saved.attending && saved.guestNames.length > 0 && (
          <ul className="text-base text-ink-soft">
            {saved.guestNames.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        )}
        {!closed && (
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setAttending(saved.attending);
              setNames(saved.guestNames.length ? saved.guestNames : [""]);
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

      {attending !== false && (
        <>
          <div className="flex flex-col gap-1.5">
            <span className="tracked text-[11px] text-ink-soft">
              {t("namesLabel")}
            </span>
            <span className="text-xs text-ink-soft/80">
              {t("allowance", { count: maxGuests })} · {t("namesHint")}
            </span>
            <div className="mt-2 flex flex-col gap-3">
              {names.map((n, i) => (
                <input
                  key={i}
                  type="text"
                  value={n}
                  onChange={(e) => setName(i, e.target.value)}
                  placeholder={t("guestField", { n: i + 1 })}
                  aria-label={t("guestField", { n: i + 1 })}
                  className="input-line"
                  autoComplete={i === 0 ? "name" : "off"}
                />
              ))}
            </div>
            {names.length < maxGuests && (
              <button
                type="button"
                onClick={() => setNames((p) => [...p, ""])}
                className="tracked mt-3 self-start border-b border-brass pb-0.5 text-[11px] text-ink-soft transition-colors hover:text-ink"
              >
                + {t("addGuest")}
              </button>
            )}
          </div>

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
        </>
      )}

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
