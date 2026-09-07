"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { usePathname, useRouter as useIntlRouter } from "@/i18n/navigation";
import type { InvitationDto } from "@/types";
import { formatResponseTime } from "@/lib/dates";

type Filter = "all" | "confirmed" | "declined" | "pending";

function statusOf(inv: InvitationDto): Exclude<Filter, "all"> {
  if (!inv.rsvp) return "pending";
  return inv.rsvp.attending ? "confirmed" : "declined";
}

function waPhone(phone: string | null): string {
  if (!phone) return "";
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("07")) d = "962" + d.slice(1);
  return d;
}

export function Dashboard({ initial }: { initial: InvitationDto[] }) {
  const t = useTranslations("dash");
  const locale = useLocale();
  const router = useRouter();
  const intlRouter = useIntlRouter();
  const pathname = usePathname();

  const [invitations, setInvitations] = useState<InvitationDto[]>(initial);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // add form
  const [addName, setAddName] = useState("");
  const [addSeats, setAddSeats] = useState(2);
  const [addPhone, setAddPhone] = useState("");
  const [addBusy, setAddBusy] = useState(false);

  // upload
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  // inline edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSeats, setEditSeats] = useState(1);
  const [editPhone, setEditPhone] = useState("");

  async function refresh() {
    const res = await fetch("/api/admin/invitations");
    if (res.status === 401) {
      router.refresh();
      return;
    }
    const data = await res.json();
    setInvitations(data.invitations);
  }

  const stats = useMemo(() => {
    let confirmed = 0;
    let declined = 0;
    let pending = 0;
    let seats = 0;
    let attending = 0;
    for (const inv of invitations) {
      seats += inv.maxGuests;
      const s = statusOf(inv);
      if (s === "confirmed") {
        confirmed++;
        attending += inv.rsvp!.guestNames.length;
      } else if (s === "declined") declined++;
      else pending++;
    }
    return { total: invitations.length, confirmed, declined, pending, seats, attending };
  }, [invitations]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invitations.filter((inv) => {
      if (filter !== "all" && statusOf(inv) !== filter) return false;
      if (!q) return true;
      return (
        inv.name.toLowerCase().includes(q) ||
        (inv.phone ?? "").includes(q) ||
        (inv.rsvp?.mobile ?? "").includes(q) ||
        inv.rsvp?.guestNames.some((n) => n.toLowerCase().includes(q))
      );
    });
  }, [invitations, query, filter]);

  function linkFor(inv: InvitationDto): string {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL ?? "";
    return `${origin}/${locale}/rsvp/${inv.code}`;
  }

  async function copyLink(inv: InvitationDto) {
    try {
      await navigator.clipboard.writeText(linkFor(inv));
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      window.prompt("", linkFor(inv));
    }
  }

  function whatsappHref(inv: InvitationDto): string {
    const msg = t("whatsappMsg", { name: inv.name, link: linkFor(inv) });
    const phone = waPhone(inv.phone);
    return phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }

  async function addGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim()) return;
    setAddBusy(true);
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addName.trim(),
          maxGuests: addSeats,
          phone: addPhone.trim() || null,
        }),
      });
      if (res.ok) {
        setAddName("");
        setAddPhone("");
        setAddSeats(2);
        await refresh();
      }
    } finally {
      setAddBusy(false);
    }
  }

  async function upload(file: File) {
    setUploadBusy(true);
    setUploadMsg(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/import", { method: "POST", body: form });
      if (!res.ok) {
        setUploadMsg(t("upload.error"));
        return;
      }
      const data = await res.json();
      setUploadMsg(t("upload.result", { added: data.added, skipped: data.skipped }));
      await refresh();
    } catch {
      setUploadMsg(t("upload.error"));
    } finally {
      setUploadBusy(false);
    }
  }

  function startEdit(inv: InvitationDto) {
    setEditId(inv.id);
    setEditName(inv.name);
    setEditSeats(inv.maxGuests);
    setEditPhone(inv.phone ?? "");
  }

  async function saveEdit() {
    if (!editId) return;
    await fetch(`/api/admin/invitations/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        maxGuests: editSeats,
        phone: editPhone.trim() || null,
      }),
    });
    setEditId(null);
    await refresh();
  }

  async function remove(inv: InvitationDto) {
    if (!window.confirm(t("actions.confirmDelete", { name: inv.name }))) return;
    await fetch(`/api/admin/invitations/${inv.id}`, { method: "DELETE" });
    await refresh();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  const chip = {
    confirmed: "bg-olive-700 text-cream border-olive-700",
    declined: "bg-clay/90 text-ivory-50 border-clay",
    pending: "border-ink-soft/50 text-ink-soft",
  } as const;

  const filters: Filter[] = ["all", "confirmed", "declined", "pending"];

  return (
    <main className="grain min-h-svh bg-ivory-50 pb-24 text-ink">
      {/* header */}
      <header className="border-b border-brass/25 bg-ivory-100/80 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <h1 className="type-display text-xl sm:text-2xl">{t("title")}</h1>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() =>
                intlRouter.replace(pathname, { locale: locale === "ar" ? "en" : "ar" })
              }
              className="min-h-10 border border-olive-700/40 px-3 py-2 transition-colors hover:border-olive-700"
            >
              {locale === "ar" ? "English" : "العربية"}
            </button>
            <a
              href="/api/admin/export"
              className="min-h-10 border border-olive-700/40 px-3 py-2 transition-colors hover:border-olive-700"
            >
              {t("export")}
            </a>
            <button
              type="button"
              onClick={logout}
              className="min-h-10 border border-olive-700/40 px-3 py-2 text-ink-soft transition-colors hover:border-olive-700"
            >
              {t("logout")}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 pt-8 sm:px-8">
        {/* stats */}
        <section className="grid grid-cols-3 gap-y-6 sm:grid-cols-6">
          {(
            [
              ["families", stats.total],
              ["confirmed", stats.confirmed],
              ["declined", stats.declined],
              ["pending", stats.pending],
              ["seats", stats.seats],
              ["attending", stats.attending],
            ] as const
          ).map(([key, value]) => (
            <div key={key} className="flex flex-col items-center gap-1 text-center">
              <span className="type-display text-3xl tabular-nums">{value}</span>
              <span className="text-[11px] text-ink-soft">{t(`stats.${key}`)}</span>
            </div>
          ))}
        </section>

        {/* add + upload */}
        <section className="grid gap-6 sm:grid-cols-2">
          <form
            onSubmit={addGuest}
            className="flex flex-col gap-4 border border-brass/30 p-5"
          >
            <h2 className="tracked text-[11px] text-ink-soft">{t("add.title")}</h2>
            <input
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder={t("add.name")}
              aria-label={t("add.name")}
              className="input-line"
            />
            <div className="flex gap-4">
              <label className="flex flex-1 flex-col gap-1 text-[11px] text-ink-soft">
                {t("add.seats")}
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={addSeats}
                  onChange={(e) => setAddSeats(Number(e.target.value) || 1)}
                  className="input-line"
                />
              </label>
              <label className="flex flex-[2] flex-col gap-1 text-[11px] text-ink-soft">
                {t("add.phone")}
                <input
                  type="tel"
                  dir="ltr"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                  className="input-line rtl:text-right"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={addBusy || !addName.trim()}
              className="tracked min-h-12 bg-olive-700 px-5 py-3 text-[11px] text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {t("add.submit")}
            </button>
          </form>

          <div className="flex flex-col gap-4 border border-brass/30 p-5">
            <h2 className="tracked text-[11px] text-ink-soft">{t("upload.title")}</h2>
            <p className="text-xs leading-relaxed text-ink-soft">{t("upload.hint")}</p>
            <label className="tracked flex min-h-12 cursor-pointer items-center justify-center border border-olive-700/50 px-5 py-3 text-center text-[11px] transition-colors hover:border-olive-700 hover:bg-olive-700 hover:text-cream">
              {uploadBusy ? t("upload.uploading") : t("upload.choose")}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                disabled={uploadBusy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(f);
                  e.target.value = "";
                }}
              />
            </label>
            {uploadMsg && <p className="text-xs text-ink">{uploadMsg}</p>}
            <a
              href="/api/admin/template"
              className="self-start border-b border-brass pb-0.5 text-xs text-ink-soft transition-colors hover:text-ink"
            >
              {t("upload.template")}
            </a>
          </div>
        </section>

        {/* search + filter */}
        <section className="flex flex-col gap-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="input-line"
          />
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`min-h-10 border px-4 py-2 text-xs transition-colors ${
                  filter === f
                    ? "border-olive-700 bg-olive-700 text-cream"
                    : "border-olive-700/40 text-ink-soft hover:border-olive-700"
                }`}
              >
                {t(`filter.${f}`)}
                {f !== "all" && (
                  <span className="ms-1.5 tabular-nums">
                    {f === "confirmed"
                      ? stats.confirmed
                      : f === "declined"
                        ? stats.declined
                        : stats.pending}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* list */}
        <section className="flex flex-col">
          {invitations.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-soft">
              {t("table.empty")}
            </p>
          ) : visible.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-soft">
              {t("table.noMatch")}
            </p>
          ) : (
            <ul className="divide-y divide-brass/25 border-y border-brass/25">
              {visible.map((inv) => {
                const s = statusOf(inv);
                const editing = editId === inv.id;
                return (
                  <li key={inv.id} className="flex flex-col gap-3 py-4">
                    {editing ? (
                      <div className="flex flex-col gap-3">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          aria-label={t("table.name")}
                          className="input-line"
                        />
                        <div className="flex gap-4">
                          <label className="flex flex-1 flex-col gap-1 text-[11px] text-ink-soft">
                            {t("add.seats")}
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={editSeats}
                              onChange={(e) => setEditSeats(Number(e.target.value) || 1)}
                              className="input-line"
                            />
                          </label>
                          <label className="flex flex-[2] flex-col gap-1 text-[11px] text-ink-soft">
                            {t("add.phone")}
                            <input
                              type="tel"
                              dir="ltr"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="input-line rtl:text-right"
                            />
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={saveEdit}
                            className="min-h-10 bg-olive-700 px-4 py-2 text-xs text-cream"
                          >
                            {t("actions.save")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditId(null)}
                            className="min-h-10 border border-olive-700/40 px-4 py-2 text-xs text-ink-soft"
                          >
                            {t("actions.cancel")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-base font-medium">{inv.name}</span>
                            <span className="text-xs text-ink-soft">
                              {inv.maxGuests} · {t("table.seats")}
                            </span>
                          </div>
                          <span
                            className={`border px-2.5 py-1 text-[11px] ${chip[s]}`}
                          >
                            {t(`status.${s}`)}
                            {s === "confirmed" && inv.rsvp
                              ? ` · ${inv.rsvp.guestNames.length}`
                              : ""}
                          </span>
                        </div>

                        {(inv.rsvp || inv.phone) && (
                          <div className="flex flex-col gap-1 text-xs text-ink-soft">
                            {inv.rsvp && inv.rsvp.guestNames.length > 0 && (
                              <span>{inv.rsvp.guestNames.join("، ")}</span>
                            )}
                            <span className="flex flex-wrap gap-x-4">
                              {(inv.rsvp?.mobile || inv.phone) && (
                                <span dir="ltr">{inv.rsvp?.mobile ?? inv.phone}</span>
                              )}
                              {inv.rsvp && (
                                <span>
                                  {t("table.respondedAt")}:{" "}
                                  {formatResponseTime(locale, new Date(inv.rsvp.updatedAt))}
                                </span>
                              )}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => copyLink(inv)}
                            className="min-h-10 border border-olive-700/40 px-3 py-2 transition-colors hover:border-olive-700"
                          >
                            {copiedId === inv.id ? t("actions.copied") : t("actions.copy")}
                          </button>
                          <a
                            href={whatsappHref(inv)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-10 border border-olive-700/40 px-3 py-2 transition-colors hover:border-olive-700"
                          >
                            {t("actions.whatsapp")}
                          </a>
                          <button
                            type="button"
                            onClick={() => startEdit(inv)}
                            className="min-h-10 border border-olive-700/40 px-3 py-2 text-ink-soft transition-colors hover:border-olive-700"
                          >
                            {t("actions.edit")}
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(inv)}
                            className="min-h-10 border border-clay/40 px-3 py-2 text-clay transition-colors hover:border-clay"
                          >
                            {t("actions.delete")}
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
