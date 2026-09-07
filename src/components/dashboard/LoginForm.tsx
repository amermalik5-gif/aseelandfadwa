"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const t = useTranslations("dash.login");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError(true);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="hero-vignette flex min-h-svh items-center justify-center px-6 text-cream">
      <form onSubmit={submit} className="flex w-full max-w-xs flex-col gap-6">
        <h1 className="type-display text-center text-2xl">{t("title")}</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("password")}
          aria-label={t("password")}
          autoFocus
          className="w-full border-b border-cream/40 bg-transparent py-2.5 text-center text-base text-cream outline-none transition-colors placeholder:text-cream-dim/60 focus:border-brass"
        />
        {error && (
          <p role="alert" className="text-center text-sm text-clay">
            {t("wrong")}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !password}
          className="tracked min-h-12 border border-cream/45 px-6 py-3 text-xs text-cream transition-colors hover:bg-cream hover:text-olive-950 disabled:opacity-50"
        >
          {t("submit")}
        </button>
      </form>
    </main>
  );
}
