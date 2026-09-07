import { event, eventDate, rsvpDeadline } from "@/config/event";

const TZ = event.timeZone;

function intlLocale(locale: string): string {
  // Levantine month names + Arabic-Indic digits for Arabic
  return locale === "ar" ? "ar-JO-u-nu-arab" : "en-GB";
}

/** "16 Oct 2026" / "١٦ تشرين الأول ٢٠٢٦" */
export function formatEventDate(locale: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: locale === "ar" ? "long" : "short",
    year: "numeric",
    timeZone: TZ,
  }).format(eventDate);
}

/** "Friday" / "الجمعة" */
export function formatEventWeekday(locale: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: "long",
    timeZone: TZ,
  }).format(eventDate);
}

/** "7:30 PM" / "٧:٣٠ مساءً" */
export function formatEventTime(locale: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  }).format(eventDate);
}

/** "11 October 2026" / "١١ تشرين الأول ٢٠٢٦" */
export function formatDeadline(locale: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(rsvpDeadline);
}

/** "5:00 pm" / "٥:٠٠ م" for an agenda stop time like "17:00" (Amman time) */
export function formatAgendaTime(locale: string, time: string): string {
  const d = new Date(`${event.dateISO.slice(0, 10)}T${time}:00+03:00`);
  return new Intl.DateTimeFormat(intlLocale(locale), {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  }).format(d);
}

/** Short date-time for the dashboard, always Amman time */
export function formatResponseTime(locale: string, date: Date): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-JO" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  }).format(date);
}

/** Localized digits for the countdown */
export function localizeNumber(locale: string, n: number): string {
  return new Intl.NumberFormat(intlLocale(locale), { useGrouping: false }).format(n);
}
