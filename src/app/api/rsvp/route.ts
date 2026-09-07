import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rsvpClosed } from "@/config/event";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const { code, attending, guestCount, mobile, locale } = (body ?? {}) as {
    code?: unknown;
    attending?: unknown;
    guestCount?: unknown;
    mobile?: unknown;
    locale?: unknown;
  };

  if (typeof code !== "string" || typeof attending !== "boolean") {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  if (rsvpClosed()) {
    return NextResponse.json({ error: "closed" }, { status: 403 });
  }

  const invitation = await prisma.invitation.findUnique({ where: { code } });
  if (!invitation) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const cleanMobile =
    typeof mobile === "string" && mobile.trim()
      ? mobile.trim().slice(0, 24)
      : null;
  const cleanLocale = locale === "en" ? "en" : "ar";

  // Attending guests choose how many are coming, capped by the invitation's seats.
  const rawCount = Number(guestCount);
  const cleanCount = attending
    ? Number.isFinite(rawCount) && rawCount >= 1
      ? Math.min(Math.floor(rawCount), invitation.maxGuests)
      : invitation.maxGuests
    : 0;

  const data = {
    attending,
    guestCount: cleanCount,
    guestNames: [],
    mobile: cleanMobile,
    locale: cleanLocale,
  };

  await prisma.rsvp.upsert({
    where: { invitationId: invitation.id },
    create: { invitationId: invitation.id, ...data },
    update: data,
  });

  return NextResponse.json({ ok: true });
}
