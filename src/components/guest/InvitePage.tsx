import { getTranslations } from "next-intl/server";
import { event, eventDate, rsvpClosed } from "@/config/event";
import {
  formatAgendaTime,
  formatDeadline,
  formatEventDate,
  formatEventTime,
  formatEventWeekday,
  localizeNumber,
} from "@/lib/dates";
import {
  Bloom,
  FloralDivider,
  Monogram,
  SmallSpray,
} from "./FloralOrnament";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;
import { Reveal } from "./Reveal";
import { LangToggle } from "./LangToggle";
import { MusicToggle } from "./MusicToggle";
import { Countdown } from "./Countdown";
import { RsvpForm } from "./RsvpForm";
import { VideoIntro } from "./VideoIntro";

type Invitation = {
  code: string;
  name: string;
  maxGuests: number;
} | null;

type ExistingRsvp = {
  attending: boolean;
  guestCount: number | null;
  mobile: string | null;
} | null;

export async function InvitePage({
  locale,
  invitation,
  existingRsvp,
}: {
  locale: string;
  invitation: Invitation;
  existingRsvp: ExistingRsvp;
}) {
  const t = await getTranslations();
  const ar = locale === "ar";
  const names = ar ? ["أصيل", "وفدوى"] : ["Aseel", "& Fadwa"];
  const dateLine = `${formatEventDate(locale)} | ${formatEventWeekday(locale)}`;

  return (
    <main className="min-h-svh">
      <LangToggle />
      <MusicToggle />

      {/* ── Scroll-scrubbed video intro ───────────────────── */}
      <VideoIntro />

      {/* ── Hero: engraved invitation on paper ────────────── */}
      <section className="grain relative overflow-hidden bg-paper text-center text-ink">
        <Reveal className="flex min-h-svh flex-col items-center justify-center px-6">
          {/* the couple's own painted roses, toned to plaster ivory */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/art/corner-l.png"
            alt=""
            aria-hidden="true"
            className="hero-orn pointer-events-none absolute bottom-0 left-0 w-36 translate-y-[20%] sm:w-60"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/art/corner-r.png"
            alt=""
            aria-hidden="true"
            className="hero-orn pointer-events-none absolute bottom-0 right-0 w-36 translate-y-[20%] sm:w-60"
          />

          {/* classic double-rule frame */}
          <div
            aria-hidden="true"
            className="stagger-item pointer-events-none absolute inset-3 border border-beige-400/60 sm:inset-6"
            style={d(0)}
          >
            <div className="absolute inset-1 h-auto w-auto border border-ink-soft/15" />
          </div>

          <div className="stagger-item" style={d(200)}>
            <Monogram
              initials={ar ? "أ · ف" : "A · F"}
              className="mx-auto w-20 sm:w-24"
            />
          </div>

          <p
            className="stagger-item tracked-wide mt-7 text-[11px] text-ink-soft sm:text-xs"
            style={d(380)}
          >
            {t("hero.tagline")}
          </p>

          <div className="stagger-item mt-5" style={d(540)}>
            <FloralDivider className="mx-auto w-52 sm:w-64" />
          </div>

          <p
            className="stagger-item type-display mt-3 text-lg text-ink sm:text-2xl"
            style={d(700)}
          >
            {dateLine}
          </p>

          <h1
            className={`stagger-item type-names mt-6 leading-tight text-ink ${
              ar
                ? "text-[3.4rem] sm:text-[5rem]"
                : "text-[3.8rem] sm:text-[5.5rem]"
            }`}
            style={d(860)}
          >
            <span className="block">{names[0]}</span>
            <span className="block">{names[1]}</span>
          </h1>

          <p
            className="stagger-item tracked mt-8 max-w-xs text-[11px] leading-loose text-ink-soft sm:max-w-none sm:text-xs"
            style={d(1040)}
          >
            {t("hero.invite")}
          </p>

          <a
            href="#rsvp"
            className="stagger-item tracked mt-10 inline-block min-w-44 bg-olive-700 px-8 py-3.5 text-xs text-cream transition-opacity hover:opacity-90"
            style={d(1200)}
          >
            {t("hero.rsvp")}
          </a>
        </Reveal>

        <a
          href="#details"
          aria-label={t("hero.scroll")}
          className="absolute bottom-6 left-0 right-0 mx-auto flex w-fit flex-col items-center gap-1 text-ink-soft/80"
        >
          <span className="tracked text-[9px]">{t("hero.scroll")}</span>
          <svg viewBox="0 0 16 16" className="bob size-4" fill="none" aria-hidden="true">
            <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </a>
      </section>

      {/* ── Details: ivory day ────────────────────────────── */}
      <section id="details" className="grain bg-ivory-50 px-6 py-20 sm:py-28">
        <Reveal stagger className="mx-auto flex max-w-lg flex-col items-center gap-8 text-center">
          <h2 className="tracked text-xs text-ink-soft">{t("details.title")}</h2>

          <div>
            <p className="type-display text-3xl text-ink sm:text-4xl">
              {ar ? event.venueAr : event.venueEn}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              {ar ? event.venueAreaAr : event.venueAreaEn}
            </p>
          </div>

          <FloralDivider className="w-56" />

          <div className="type-display flex items-center justify-center gap-5 text-lg text-ink sm:text-xl">
            <span>{formatEventDate(locale)}</span>
            <span className="h-5 w-px bg-brass/40" aria-hidden="true" />
            <span>{formatEventWeekday(locale)}</span>
            <span className="h-5 w-px bg-brass/40" aria-hidden="true" />
            <span>{formatEventTime(locale)}</span>
          </div>

          <a
            href={`/api/ics?lang=${locale}`}
            className="tracked mt-2 min-h-12 w-full max-w-xs border border-olive-700/50 px-6 py-3.5 text-center text-[11px] text-ink transition-colors hover:border-olive-700 hover:bg-olive-700 hover:text-cream sm:w-auto"
          >
            {t("details.calendar")}
          </a>
        </Reveal>
      </section>

      {/* ── Location ──────────────────────────────────────── */}
      <section className="grain bg-ivory-100 px-6 py-20 sm:py-24">
        <Reveal stagger className="mx-auto flex max-w-lg flex-col items-center gap-6 text-center">
          <h2 className="tracked text-xs text-ink-soft">{t("location.title")}</h2>
          <div>
            <p className="type-display text-3xl text-ink sm:text-4xl">
              {ar ? event.venueAr : event.venueEn}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              {ar ? event.venueAreaAr : event.venueAreaEn}
            </p>
          </div>
          <a
            href={event.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tracked flex min-h-14 w-full max-w-md items-center justify-center bg-olive-700 px-6 py-4 text-xs text-cream transition-opacity hover:opacity-90"
          >
            {t("location.button")}
          </a>
        </Reveal>
      </section>

      {/* ── Agenda: wedding-day timeline ──────────────────── */}
      <section className="grain bg-ivory-50 px-6 py-20 sm:py-28">
        <Reveal className="mx-auto w-full max-w-lg">
          <h2 className="tracked text-center text-xs text-ink-soft">
            {t("agenda.title")}
          </h2>
          <ol className="mx-auto mt-12 w-fit min-w-64">
            {event.agenda.map((stop, i) => {
              const area = ar ? stop.areaAr : stop.areaEn;
              const last = i === event.agenda.length - 1;
              return (
                <li
                  key={stop.key}
                  className="stagger-item relative ps-8 pb-12 last:pb-0"
                  style={d(300 + i * 220)}
                >
                  {!last && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 start-[8.5px] top-6 w-px bg-beige-400/70"
                    />
                  )}
                  <Bloom className="absolute start-0 top-1.5 size-[18px]" />
                  <p className="type-display text-2xl text-ink">
                    {formatAgendaTime(locale, stop.time)}
                  </p>
                  <p className="mt-1.5 text-base font-medium text-ink">
                    {t(`agenda.stops.${stop.key}`)}
                  </p>
                  {area && (
                    <p className="mt-0.5 text-sm text-ink-soft">{area}</p>
                  )}
                  <a
                    href={stop.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tracked mt-3 inline-block border-b border-brass pb-0.5 text-[11px] text-ink-soft transition-colors hover:text-ink"
                  >
                    {t("agenda.map")}
                  </a>
                </li>
              );
            })}
          </ol>
        </Reveal>
      </section>

      {/* ── Countdown ─────────────────────────────────────── */}
      <section className="grain bg-ivory-100 px-6 py-20 sm:py-24">
        <Reveal stagger className="mx-auto flex max-w-lg flex-col items-center gap-8 text-center">
          <h2 className="tracked text-xs text-ink-soft">{t("countdown.title")}</h2>
          <p className="type-display text-2xl text-ink sm:text-3xl">
            {t("countdown.subtitle")}
          </p>
          <Countdown targetMs={eventDate.getTime()} />
          <p className="text-sm leading-relaxed text-ink-soft">
            {t("countdown.closing")}
          </p>
        </Reveal>
      </section>

      {/* ── A kind note: adults-only ──────────────────────── */}
      <section className="bg-olive-900 px-6 py-16 text-center text-cream sm:py-20">
        <Reveal stagger className="mx-auto flex max-w-md flex-col items-center gap-5">
          <p className="tracked text-[11px] text-cream-dim">
            {t("children.kicker")}
          </p>
          <SmallSpray tone="cream" className="w-44" />
          <p className="text-base leading-loose text-cream/95">
            {t("children.body")}
          </p>
          <p className="text-xs text-cream-dim">{t("children.thanks")}</p>
        </Reveal>
      </section>

      {/* ── RSVP ──────────────────────────────────────────── */}
      <section id="rsvp" className="grain bg-ivory-50 px-6 py-20 sm:py-28">
        <Reveal stagger className="mx-auto flex w-full max-w-lg flex-col items-center gap-8">
          <h2 className="tracked text-xs text-ink-soft">{t("rsvp.title")}</h2>

          {invitation ? (
            <>
              <div className="text-center">
                <p className="text-xs text-ink-soft">{t("rsvp.greeting")}</p>
                <p className="type-display mt-1 text-3xl text-ink sm:text-4xl">
                  {invitation.name}
                </p>
                <p className="mt-3 text-sm text-ink-soft">
                  {t("rsvp.allowance", {
                    count: invitation.maxGuests,
                    countDisplay: localizeNumber(locale, invitation.maxGuests),
                  })}
                </p>
              </div>
              <p className="text-center text-sm text-ink-soft">
                {t("rsvp.deadline", { date: formatDeadline(locale) })}
              </p>
              <FloralDivider className="w-44" />
              <RsvpForm
                code={invitation.code}
                maxGuests={invitation.maxGuests}
                existing={existingRsvp}
                closed={rsvpClosed()}
              />
            </>
          ) : (
            <p className="max-w-md text-center text-base leading-relaxed text-ink-soft">
              {t("rsvp.noCode")}
            </p>
          )}
        </Reveal>
      </section>

      {/* ── Footer: back to olive ─────────────────────────── */}
      <footer className="bg-olive-900 px-6 py-14 text-center text-cream">
        <SmallSpray tone="cream" className="mx-auto w-48" />
        <p className="type-names mt-4 text-3xl">
          {ar ? "أصيل وفدوى" : "Aseel & Fadwa"}
        </p>
        <p className="tracked mt-3 text-[10px] text-cream-dim">
          {formatEventDate(locale)}
        </p>
      </footer>
    </main>
  );
}
