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
    <main className="grain flex min-h-svh items-center justify-center bg-paper px-6 text-ink">
      <form onSubmit={submit} className="flex w-full max-w-xs flex-col gap-6">
        <h1 className="type-display text-center text-2xl">{t("title")}</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("password")}
          aria-label={t("password")}
          autoFocus
          className="input-line text-center"
        />
        {error && (
          <p role="alert" className="text-center text-sm text-clay">
            {t("wrong")}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !password}
          className="tracked min-h-12 bg-olive-700 px-6 py-3 text-xs text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t("submit")}
        </button>
      </form>
    </main>
  );
}
