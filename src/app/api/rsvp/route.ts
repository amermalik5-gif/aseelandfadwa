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

  const { code, attending, guestNames, mobile, locale } = (body ?? {}) as {
    code?: unknown;
    attending?: unknown;
    guestNames?: unknown;
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

  const names = Array.isArray(guestNames)
    ? guestNames
        .filter((n): n is string => typeof n === "string")
        .map((n) => n.trim())
        .filter(Boolean)
        .slice(0, invitation.maxGuests)
        .map((n) => n.slice(0, 120))
    : [];

  if (attending && names.length === 0) {
    return NextResponse.json({ error: "names required" }, { status: 400 });
  }

  const cleanMobile =
    typeof mobile === "string" && mobile.trim()
      ? mobile.trim().slice(0, 24)
      : null;
  const cleanLocale = locale === "en" ? "en" : "ar";

  const data = {
    attending,
    guestNames: attending ? names : [],
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
