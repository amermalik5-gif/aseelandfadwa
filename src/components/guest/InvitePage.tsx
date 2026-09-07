import { getTranslations } from "next-intl/server";
import { event, eventDate, rsvpClosed } from "@/config/event";
import {
  formatDeadline,
  formatEventDate,
  formatEventTime,
  formatEventWeekday,
} from "@/lib/dates";
import { OliveSprig, RuleDiamond } from "./Ornament";
import { Reveal } from "./Reveal";
import { LangToggle } from "./LangToggle";
import { MusicToggle } from "./MusicToggle";
import { Countdown } from "./Countdown";
import { RsvpForm } from "./RsvpForm";

type Invitation = {
  code: string;
  name: string;
  maxGuests: number;
} | null;

type ExistingRsvp = {
  attending: boolean;
  guestNames: string[];
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

      {/* ── Hero: olive night ─────────────────────────────── */}
      <section className="hero-vignette relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 text-center text-cream">
        <p className="rise rise-1 tracked-wide text-[11px] text-cream-dim sm:text-xs">
          {t("hero.tagline")}
        </p>

        <div className="rise rise-2 mt-8 text-brass/80">
          <OliveSprig className="mx-auto w-40 sm:w-52" />
        </div>

        <p className="rise rise-2 type-display mt-6 text-lg text-cream/90 sm:text-2xl">
          {dateLine}
        </p>

        <h1
          className={`rise rise-3 type-names mt-6 leading-tight text-cream ${
            ar
              ? "text-[3.4rem] sm:text-[5rem]"
              : "text-[3.8rem] sm:text-[5.5rem]"
          }`}
        >
          <span className="block">{names[0]}</span>
          <span className="block">{names[1]}</span>
        </h1>

        <p className="rise rise-4 tracked mt-8 max-w-xs text-[11px] leading-loose text-cream-dim sm:max-w-none sm:text-xs">
          {t("hero.invite")}
        </p>

        <a
          href="#rsvp"
          className="rise rise-4 tracked mt-10 inline-block min-w-44 border border-cream/45 px-8 py-3.5 text-xs text-cream transition-colors hover:bg-cream hover:text-olive-950"
        >
          {t("hero.rsvp")}
        </a>

        <a
          href="#details"
          aria-label={t("hero.scroll")}
          className="absolute bottom-6 flex flex-col items-center gap-1 text-cream-dim/80"
        >
          <span className="tracked text-[9px]">{t("hero.scroll")}</span>
          <svg viewBox="0 0 16 16" className="bob size-4" fill="none" aria-hidden="true">
            <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </a>
      </section>

      {/* ── Details: ivory day ────────────────────────────── */}
      <section id="details" className="grain bg-ivory-50 px-6 py-20 sm:py-28">
        <Reveal className="mx-auto flex max-w-lg flex-col items-center gap-8 text-center">
          <h2 className="tracked text-xs text-ink-soft">{t("details.title")}</h2>

          <div>
            <p className="type-display text-3xl text-ink sm:text-4xl">
              {ar ? event.venueAr : event.venueEn}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              {ar ? event.venueAreaAr : event.venueAreaEn}
            </p>
          </div>

          <RuleDiamond className="w-56" />

          <div className="type-display flex items-center justify-center gap-5 text-lg text-ink sm:text-xl">
            <span>{formatEventDate(locale)}</span>
            <span className="h-5 w-px bg-brass/40" aria-hidden="true" />
            <span>{formatEventWeekday(locale)}</span>
            <span className="h-5 w-px bg-brass/40" aria-hidden="true" />
            <span>{formatEventTime(locale)}</span>
          </div>

          <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
            <a
              href={`/api/ics?lang=${locale}`}
              className="tracked min-h-12 border border-olive-700/50 px-6 py-3.5 text-[11px] text-ink transition-colors hover:border-olive-700 hover:bg-olive-700 hover:text-cream"
            >
              {t("details.calendar")}
            </a>
            <a
              href={event.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tracked min-h-12 border border-olive-700/50 px-6 py-3.5 text-[11px] text-ink transition-colors hover:border-olive-700 hover:bg-olive-700 hover:text-cream"
            >
              {t("details.location")}
            </a>
          </div>
        </Reveal>
      </section>

      {/* ── Countdown ─────────────────────────────────────── */}
      <section className="grain bg-ivory-100 px-6 py-20 sm:py-24">
        <Reveal className="mx-auto flex max-w-lg flex-col items-center gap-8 text-center">
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

      {/* ── RSVP ──────────────────────────────────────────── */}
      <section id="rsvp" className="grain bg-ivory-50 px-6 py-20 sm:py-28">
        <Reveal className="mx-auto flex w-full max-w-lg flex-col items-center gap-8">
          <h2 className="tracked text-xs text-ink-soft">{t("rsvp.title")}</h2>

          {invitation ? (
            <>
              <div className="text-center">
                <p className="text-xs text-ink-soft">{t("rsvp.greeting")}</p>
                <p className="type-display mt-1 text-3xl text-ink sm:text-4xl">
                  {invitation.name}
                </p>
              </div>
              <p className="text-center text-sm text-ink-soft">
                {t("rsvp.deadline", { date: formatDeadline(locale) })}
              </p>
              <RuleDiamond className="w-40" />
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
        <div className="text-brass/70">
          <OliveSprig className="mx-auto w-32" />
        </div>
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
