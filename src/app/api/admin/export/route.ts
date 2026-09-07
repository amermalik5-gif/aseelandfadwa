import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { buildExport } from "@/lib/excel";
import { formatResponseTime } from "@/lib/dates";

type Status = "confirmed" | "declined" | "pending" | "notSent" | "openedNoReply";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    req.nextUrl.origin;

  const status = req.nextUrl.searchParams.get("status") as Status | null;
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();

  const invitations = await prisma.invitation.findMany({
    include: { rsvp: true },
    orderBy: { createdAt: "asc" },
  });

  const filtered = invitations.filter((inv) => {
    if (status === "confirmed" && !(inv.rsvp && inv.rsvp.attending)) return false;
    if (status === "declined" && !(inv.rsvp && !inv.rsvp.attending)) return false;
    if (status === "pending" && inv.rsvp) return false;
    if (status === "notSent" && inv.sentAt) return false;
    if (status === "openedNoReply" && !(inv.viewedAt && !inv.rsvp)) return false;
    if (!q) return true;
    return (
      inv.name.toLowerCase().includes(q) ||
      (inv.phone ?? "").includes(q) ||
      (inv.rsvp?.mobile ?? "").includes(q) ||
      (inv.notes ?? "").toLowerCase().includes(q) ||
      (inv.tableNo ?? "").toLowerCase().includes(q)
    );
  });

  const buffer = buildExport(
    filtered.map((inv) => {
      return {
        name: inv.name,
        maxGuests: inv.maxGuests,
        phone: inv.phone,
        status: !inv.rsvp
          ? "Pending / بانتظار الرد"
          : inv.rsvp.attending
            ? "Confirmed / مؤكد"
            : "Declined / معتذر",
        attendingCount: inv.rsvp?.attending
          ? (inv.rsvp.guestCount ?? inv.maxGuests)
          : inv.rsvp
            ? 0
            : null,
        mobile: inv.rsvp?.mobile ?? null,
        respondedAt: inv.rsvp
          ? formatResponseTime("en", inv.rsvp.updatedAt)
          : "",
        sent: inv.sentAt ? "Yes / نعم" : "",
        opened: inv.viewedAt ? "Yes / نعم" : "",
        tableNo: inv.tableNo ?? "",
        notes: inv.notes ?? "",
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
