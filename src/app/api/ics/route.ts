import { NextRequest, NextResponse } from "next/server";
import { event, eventDate } from "@/config/event";

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function GET(req: NextRequest) {
  const ar = req.nextUrl.searchParams.get("lang") === "ar";
  const title = ar
    ? `حفل زفاف ${event.coupleAr}`
    : `${event.coupleEn} Wedding`;
  const location = ar
    ? `${event.venueAr}، ${event.venueAreaAr}`
    : `${event.venueEn}, ${event.venueAreaEn}`;

  const start = eventDate;
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//aseelandfadwa//rsvp//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:wedding-${start.getTime()}@aseelandfadwa`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `URL:${event.mapsUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="aseel-and-fadwa.ics"',
    },
  });
}
