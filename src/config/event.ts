// Central event configuration. Edit here to change details shown across the site.
// Jordan is UTC+3 year-round (no DST since 2022).

export const event = {
  coupleEn: "Aseel & Fadwa",
  coupleAr: "أصيل وفدوى",
  // Used in <title> and share text
  siteNameEn: "Aseel and Fadwa",
  siteNameAr: "أصيل وفدوى",

  // Event start, Amman time (UTC+3)
  dateISO: "2026-10-16T19:30:00+03:00",
  timeZone: "Asia/Amman",

  // RSVP allowed until the end of this day (Amman time)
  rsvpDeadlineISO: "2026-10-11T23:59:59+03:00",

  venueEn: "EVA Hall",
  venueAr: "قاعة إيفا",
  venueAreaEn: "Airport Road, Amman",
  venueAreaAr: "طريق المطار، عمّان",
  mapsUrl: "https://maps.app.goo.gl/XVhXm2447mQXHVf1A",
} as const;

export const eventDate = new Date(event.dateISO);
export const rsvpDeadline = new Date(event.rsvpDeadlineISO);

export function rsvpClosed(now: Date = new Date()): boolean {
  return now.getTime() > rsvpDeadline.getTime();
}
