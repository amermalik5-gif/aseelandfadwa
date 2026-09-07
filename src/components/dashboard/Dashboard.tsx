"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { usePathname, useRouter as useIntlRouter } from "@/i18n/navigation";
import type { InvitationDto } from "@/types";
import { formatResponseTime } from "@/lib/dates";
import { event } from "@/config/event";

type Filter =
  | "all"
  | "confirmed"
  | "declined"
  | "pending"
  | "notSent"
  | "openedNoReply";
type Sort = "created" | "newestReply" | "name" | "status";

function statusOf(inv: InvitationDto): "confirmed" | "declined" | "pending" {
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

export function Dashboard({
  initial,
  waTemplateInitial,
}: {
  initial: InvitationDto[];
  waTemplateInitial: string;
}) {
  const t = useTranslations("dash");
  const locale = useLocale();
  const router = useRouter();
  const intlRouter = useIntlRouter();
  const pathname = usePathname();

  const [invitations, setInvitations] = useState<InvitationDto[]>(initial);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("created");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // add form
  const [addName, setAddName] = useState("");
  const [addSeats, setAddSeats] = useState(2);
  const [addPhone, setAddPhone] = useState("");
  const [addBusy, setAddBusy] = useState(false);

  // upload
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  // whatsapp message template
  const [waTemplate, setWaTemplate] = useState(waTemplateInitial);
  const [waDraft, setWaDraft] = useState(waTemplateInitial);
  const [waSaved, setWaSaved] = useState(false);
  const [waBusy, setWaBusy] = useState(false);

  // expandable details panel
  const [openId, setOpenId] = useState<string | null>(null);
  const [eName, setEName] = useState("");
  const [eSeats, setESeats] = useState(1);
  const [ePhone, setEPhone] = useState("");
  const [eTable, setETable] = useState("");
  const [eNotes, setENotes] = useState("");
  const [eReplyCount, setEReplyCount] = useState(1);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/invitations");
    if (res.status === 401) {
      router.refresh();
      return;
    }
    const data = await res.json();
    setInvitations(data.invitations);
  }

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch(`/api/admin/invitations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await refresh();
  }

  const stats = useMemo(() => {
    let confirmed = 0;
    let declined = 0;
    let pending = 0;
    let seats = 0;
    let attending = 0;
    let notSent = 0;
    let openedNoReply = 0;
    for (const inv of invitations) {
      seats += inv.maxGuests;
      if (!inv.sentAt) notSent++;
      if (inv.viewedAt && !inv.rsvp) openedNoReply++;
      const s = statusOf(inv);
      if (s === "confirmed") {
        confirmed++;
        attending += inv.rsvp!.guestCount ?? inv.maxGuests;
      } else if (s === "declined") declined++;
      else pending++;
    }
    return {
      total: invitations.length,
      confirmed,
      declined,
      pending,
      seats,
      attending,
      notSent,
      openedNoReply,
      remaining: event.hallCapacity - attending,
    };
  }, [invitations]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = invitations.filter((inv) => {
      const s = statusOf(inv);
      if (filter === "notSent" && inv.sentAt) return false;
      if (filter === "openedNoReply" && !(inv.viewedAt && !inv.rsvp)) return false;
      if (
        (filter === "confirmed" || filter === "declined" || filter === "pending") &&
        s !== filter
      )
        return false;
      if (!q) return true;
      return (
        inv.name.toLowerCase().includes(q) ||
        (inv.phone ?? "").includes(q) ||
        (inv.rsvp?.mobile ?? "").includes(q) ||
        (inv.notes ?? "").toLowerCase().includes(q) ||
        (inv.tableNo ?? "").toLowerCase().includes(q)
      );
    });
    const rank = { pending: 0, confirmed: 1, declined: 2 } as const;
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name, locale === "ar" ? "ar" : "en");
        case "newestReply": {
          const ta = a.rsvp ? Date.parse(a.rsvp.updatedAt) : 0;
          const tb = b.rsvp ? Date.parse(b.rsvp.updatedAt) : 0;
          return tb - ta;
        }
        case "status":
          return rank[statusOf(a)] - rank[statusOf(b)];
        default:
          return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      }
    });
  }, [invitations, query, filter, sort, locale]);

  function linkFor(inv: InvitationDto): string {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL ?? "";
    // Shared links always open the Arabic version; guests can switch via the toggle.
    return `${origin}/ar/rsvp/${inv.code}`;
  }

  function markSentSilently(inv: InvitationDto) {
    if (!inv.sentAt) void patch(inv.id, { sent: true });
  }

  async function copyLink(inv: InvitationDto) {
    try {
      await navigator.clipboard.writeText(linkFor(inv));
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      window.prompt("", linkFor(inv));
    }
    markSentSilently(inv);
  }

  function waHref(inv: InvitationDto, kind: "invite" | "reminder"): string {
    const link = linkFor(inv);
    let msg: string;
    if (kind === "invite") {
      msg = waTemplate.replaceAll("{name}", inv.name);
      msg = msg.includes("{link}")
        ? msg.replaceAll("{link}", link)
        : `${msg}\n${link}`;
    } else {
      msg = t("reminderMsg", { name: inv.name, link });
    }
    const phone = waPhone(inv.phone);
    return phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }

  async function saveWaTemplate() {
    if (!waDraft.trim()) return;
    setWaBusy(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waTemplate: waDraft.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setWaTemplate(data.waTemplate);
        setWaSaved(true);
        setTimeout(() => setWaSaved(false), 1600);
      }
    } finally {
      setWaBusy(false);
    }
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

  function openDetails(inv: InvitationDto) {
    setOpenId(inv.id);
    setEName(inv.name);
    setESeats(inv.maxGuests);
    setEPhone(inv.phone ?? "");
    setETable(inv.tableNo ?? "");
    setENotes(inv.notes ?? "");
    setEReplyCount(inv.rsvp?.guestCount ?? inv.maxGuests);
  }

  async function saveDetails(id: string) {
    await patch(id, {
      name: eName,
      maxGuests: eSeats,
      phone: ePhone.trim() || null,
      tableNo: eTable,
      notes: eNotes,
    });
    setSavedId(id);
    setTimeout(() => setSavedId(null), 1600);
  }

  async function saveReply(id: string, attending: boolean) {
    await patch(id, { reply: { attending, guestCount: eReplyCount } });
    setSavedId(id);
    setTimeout(() => setSavedId(null), 1600);
  }

  async function remove(inv: InvitationDto) {
    if (!window.confirm(t("actions.confirmDelete", { name: inv.name }))) return;
    await fetch(`/api/admin/invitations/${inv.id}`, { method: "DELETE" });
    setOpenId(null);
    await refresh();
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allVisibleSelected =
    visible.length > 0 && visible.every((inv) => selected.has(inv.id));

  function toggleSelectAll() {
    setSelected((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        for (const inv of visible) next.delete(inv.id);
        return next;
      }
      return new Set([...prev, ...visible.map((inv) => inv.id)]);
    });
  }

  async function bulkDelete() {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!window.confirm(t("bulk.confirm", { count: ids.length }))) return;
    await fetch("/api/admin/invitations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setSelected(new Set());
    setOpenId(null);
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

  const filters: Filter[] = [
    "all",
    "confirmed",
    "declined",
    "pending",
    "notSent",
    "openedNoReply",
  ];
  const filterCount: Record<Exclude<Filter, "all">, number> = {
    confirmed: stats.confirmed,
    declined: stats.declined,
    pending: stats.pending,
    notSent: stats.notSent,
    openedNoReply: stats.openedNoReply,
  };

  const exportHref = `/api/admin/export?status=${filter === "all" ? "" : filter}&q=${encodeURIComponent(query.trim())}`;

  const btn =
    "min-h-10 border border-olive-700/40 px-3 py-2 transition-colors hover:border-olive-700";

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
              className={btn}
            >
              {locale === "ar" ? "English" : "العربية"}
            </button>
            <a href={exportHref} className={btn}>
              {t("export")}
            </a>
            <button type="button" onClick={logout} className={`${btn} text-ink-soft`}>
              {t("logout")}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 pt-8 sm:px-8">
        {/* stats */}
        <section className="grid grid-cols-3 gap-y-6 sm:grid-cols-7">
          {(
            [
              ["families", stats.total, ""],
              ["confirmed", stats.confirmed, ""],
              ["declined", stats.declined, ""],
              ["pending", stats.pending, ""],
              ["seats", stats.seats, ""],
              ["attending", stats.attending, ""],
              [
                "remaining",
                stats.remaining,
                stats.remaining < 0 ? "text-clay" : "",
              ],
            ] as const
          ).map(([key, value, extra]) => (
            <div key={key} className="flex flex-col items-center gap-1 text-center">
              <span className={`type-display text-3xl tabular-nums ${extra}`}>
                {value}
              </span>
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

        {/* whatsapp message template */}
        <section className="flex flex-col gap-4 border border-brass/30 p-5">
          <h2 className="tracked text-[11px] text-ink-soft">
            {t("waTemplate.title")}
          </h2>
          <p className="text-xs leading-relaxed text-ink-soft">
            {t("waTemplate.hint")}
          </p>
          <textarea
            value={waDraft}
            onChange={(e) => setWaDraft(e.target.value)}
            rows={6}
            dir="auto"
            className="input-line resize-y leading-relaxed"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={saveWaTemplate}
              disabled={waBusy || !waDraft.trim() || waDraft.trim() === waTemplate}
              className="tracked min-h-11 bg-olive-700 px-5 py-2.5 text-[11px] text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {waSaved ? t("waTemplate.saved") : t("waTemplate.save")}
            </button>
          </div>
        </section>

        {/* search + filter + sort */}
        <section className="flex flex-col gap-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="input-line"
          />
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`min-h-10 border px-3.5 py-2 text-xs transition-colors ${
                  filter === f
                    ? "border-olive-700 bg-olive-700 text-cream"
                    : "border-olive-700/40 text-ink-soft hover:border-olive-700"
                }`}
              >
                {t(`filter.${f}`)}
                {f !== "all" && (
                  <span className="ms-1.5 tabular-nums">{filterCount[f]}</span>
                )}
              </button>
            ))}
            <label className="ms-auto flex items-center gap-2 text-[11px] text-ink-soft">
              {t("sort.label")}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="min-h-10 border border-olive-700/40 bg-transparent px-2 py-2 text-xs text-ink"
              >
                <option value="created">{t("sort.created")}</option>
                <option value="newestReply">{t("sort.newestReply")}</option>
                <option value="name">{t("sort.name")}</option>
                <option value="status">{t("sort.status")}</option>
              </select>
            </label>
          </div>
        </section>

        {/* list */}
        <section className="flex flex-col">
          {visible.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 pb-3 text-xs">
              <label className="flex cursor-pointer items-center gap-2 text-ink-soft">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                  className="size-4 accent-olive-700"
                />
                {t("bulk.selectAll")}
              </label>
              {selected.size > 0 && (
                <>
                  <span className="text-ink">
                    {t("bulk.selected", { count: selected.size })}
                  </span>
                  <button
                    type="button"
                    onClick={bulkDelete}
                    className="min-h-10 border border-clay/50 px-3 py-2 text-clay transition-colors hover:border-clay"
                  >
                    {t("bulk.delete")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelected(new Set())}
                    className="min-h-10 border border-olive-700/40 px-3 py-2 text-ink-soft transition-colors hover:border-olive-700"
                  >
                    {t("bulk.clear")}
                  </button>
                </>
              )}
            </div>
          )}
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
                const open = openId === inv.id;
                return (
                  <li key={inv.id} className="flex flex-col gap-3 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selected.has(inv.id)}
                          onChange={() => toggleSelected(inv.id)}
                          aria-label={t("bulk.selectRow", { name: inv.name })}
                          className="size-4 shrink-0 accent-olive-700"
                        />
                        <span className="text-base font-medium">{inv.name}</span>
                        <span className="text-xs text-ink-soft">
                          {inv.maxGuests} · {t("table.seats")}
                        </span>
                      </label>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {inv.tableNo && (
                          <span className="border border-brass/50 px-2 py-1 text-[11px] text-ink-soft">
                            {t("badges.table", { n: inv.tableNo })}
                          </span>
                        )}
                        {inv.sentAt ? (
                          <span className="border border-olive-700/60 bg-olive-700/10 px-2 py-1 text-[11px] font-medium text-olive-700">
                            ✓ {t("badges.sent")}
                          </span>
                        ) : (
                          <span className="border border-clay/50 px-2 py-1 text-[11px] text-clay">
                            {t("filter.notSent")}
                          </span>
                        )}
                        {inv.viewedAt && (
                          <span className="border border-olive-700/30 px-2 py-1 text-[11px] text-ink-soft">
                            {t("badges.opened")}
                          </span>
                        )}
                        <span className={`border px-2.5 py-1 text-[11px] ${chip[s]}`}>
                          {t(`status.${s}`)}
                          {s === "confirmed"
                            ? ` · ${inv.rsvp!.guestCount ?? inv.maxGuests}`
                            : ""}
                        </span>
                      </div>
                    </div>

                    {(inv.rsvp || inv.phone || inv.notes) && (
                      <div className="flex flex-col gap-1 text-xs text-ink-soft">
                        {inv.notes && <span className="italic">{inv.notes}</span>}
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
                          {inv.sentAt && (
                            <span>
                              {t("details.sentOn")}:{" "}
                              {formatResponseTime(locale, new Date(inv.sentAt))}
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs">
                      <button type="button" onClick={() => copyLink(inv)} className={btn}>
                        {copiedId === inv.id ? t("actions.copied") : t("actions.copy")}
                      </button>
                      <a
                        href={waHref(inv, "invite")}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => markSentSilently(inv)}
                        className={
                          inv.sentAt
                            ? btn
                            : "min-h-10 bg-olive-700 px-3 py-2 text-cream transition-opacity hover:opacity-90"
                        }
                      >
                        {inv.sentAt ? `✓ ${t("actions.whatsapp")}` : t("actions.whatsapp")}
                      </a>
                      {s === "pending" && inv.sentAt && (
                        <a
                          href={waHref(inv, "reminder")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={btn}
                        >
                          {t("actions.reminder")}
                        </a>
                      )}
                      <a href={`/api/admin/qr/${inv.id}`} className={btn}>
                        {t("actions.qr")}
                      </a>
                      <button
                        type="button"
                        onClick={() => (open ? setOpenId(null) : openDetails(inv))}
                        className={`${btn} ${open ? "border-olive-700 bg-olive-700 text-cream" : "text-ink-soft"}`}
                      >
                        {open ? t("details.close") : t("details.open")}
                      </button>
                    </div>

                    {open && (
                      <div className="mt-2 flex flex-col gap-5 border border-brass/30 p-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="flex flex-col gap-1 text-[11px] text-ink-soft">
                            {t("table.name")}
                            <input
                              value={eName}
                              onChange={(e) => setEName(e.target.value)}
                              className="input-line"
                            />
                          </label>
                          <div className="flex gap-4">
                            <label className="flex flex-1 flex-col gap-1 text-[11px] text-ink-soft">
                              {t("add.seats")}
                              <input
                                type="number"
                                min={1}
                                max={50}
                                value={eSeats}
                                onChange={(e) => setESeats(Number(e.target.value) || 1)}
                                className="input-line"
                              />
                            </label>
                            <label className="flex flex-1 flex-col gap-1 text-[11px] text-ink-soft">
                              {t("details.table")}
                              <input
                                value={eTable}
                                onChange={(e) => setETable(e.target.value)}
                                className="input-line"
                              />
                            </label>
                          </div>
                          <label className="flex flex-col gap-1 text-[11px] text-ink-soft">
                            {t("add.phone")}
                            <input
                              type="tel"
                              dir="ltr"
                              value={ePhone}
                              onChange={(e) => setEPhone(e.target.value)}
                              className="input-line rtl:text-right"
                            />
                          </label>
                          <label className="flex flex-col gap-1 text-[11px] text-ink-soft">
                            {t("details.notes")}
                            <textarea
                              value={eNotes}
                              onChange={(e) => setENotes(e.target.value)}
                              placeholder={t("details.notesPlaceholder")}
                              rows={2}
                              className="input-line resize-y"
                            />
                          </label>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => saveDetails(inv.id)}
                            className="min-h-10 bg-olive-700 px-4 py-2 text-cream"
                          >
                            {savedId === inv.id ? t("details.saved") : t("details.save")}
                          </button>
                          <button
                            type="button"
                            onClick={() => patch(inv.id, { sent: !inv.sentAt })}
                            className={btn}
                          >
                            {inv.sentAt ? t("details.unmarkSent") : t("details.markSent")}
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(inv)}
                            className="min-h-10 border border-clay/40 px-3 py-2 text-clay transition-colors hover:border-clay"
                          >
                            {t("actions.delete")}
                          </button>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-brass/25 pt-4">
                          <p className="tracked text-[11px] text-ink-soft">
                            {t("details.reply")}
                          </p>
                          <label className="flex max-w-40 flex-col gap-1 text-[11px] text-ink-soft">
                            {t("details.replyCount")}
                            <input
                              type="number"
                              min={1}
                              max={inv.maxGuests}
                              value={eReplyCount}
                              onChange={(e) =>
                                setEReplyCount(
                                  Math.min(
                                    inv.maxGuests,
                                    Math.max(1, Number(e.target.value) || 1)
                                  )
                                )
                              }
                              className="input-line"
                            />
                          </label>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => saveReply(inv.id, true)}
                              className={btn}
                            >
                              ✓ {t("details.replyYes")}
                            </button>
                            <button
                              type="button"
                              onClick={() => saveReply(inv.id, false)}
                              className={btn}
                            >
                              ✕ {t("details.replyNo")}
                            </button>
                            {inv.rsvp && (
                              <button
                                type="button"
                                onClick={() => patch(inv.id, { reply: null })}
                                className={`${btn} text-ink-soft`}
                              >
                                {t("details.replyClear")}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
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
