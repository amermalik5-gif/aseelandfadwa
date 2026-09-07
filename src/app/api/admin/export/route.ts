import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { buildExport } from "@/lib/excel";
import { formatResponseTime } from "@/lib/dates";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    req.nextUrl.origin;

  const invitations = await prisma.invitation.findMany({
    include: { rsvp: true },
    orderBy: { createdAt: "asc" },
  });

  const buffer = buildExport(
    invitations.map((inv) => {
      const names = (inv.rsvp?.guestNames as string[] | undefined) ?? [];
      return {
        name: inv.name,
        maxGuests: inv.maxGuests,
        phone: inv.phone,
        status: !inv.rsvp
          ? "Pending / بانتظار الرد"
          : inv.rsvp.attending
            ? "Confirmed / مؤكد"
            : "Declined / معتذر",
        attendingCount: inv.rsvp?.attending ? names.length : inv.rsvp ? 0 : null,
        guestNames: names.join("، "),
        mobile: inv.rsvp?.mobile ?? null,
        respondedAt: inv.rsvp
          ? formatResponseTime("en", inv.rsvp.updatedAt)
          : "",
        link: `${base}/ar/rsvp/${inv.code}`,
      };
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="aseel-fadwa-rsvps.xlsx"',
    },
  });
}
