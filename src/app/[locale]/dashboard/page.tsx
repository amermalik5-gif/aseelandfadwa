import { isAdmin } from "@/lib/adminSession";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "@/components/dashboard/LoginForm";
import { Dashboard } from "@/components/dashboard/Dashboard";
import type { InvitationDto } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!(await isAdmin())) {
    return <LoginForm />;
  }

  const invitations = await prisma.invitation.findMany({
    include: { rsvp: true },
    orderBy: { createdAt: "desc" },
  });

  const initial: InvitationDto[] = invitations.map((inv) => ({
    id: inv.id,
    code: inv.code,
    name: inv.name,
    maxGuests: inv.maxGuests,
    phone: inv.phone,
    sentAt: inv.sentAt?.toISOString() ?? null,
    viewedAt: inv.viewedAt?.toISOString() ?? null,
    notes: inv.notes,
    tableNo: inv.tableNo,
    createdAt: inv.createdAt.toISOString(),
    rsvp: inv.rsvp
      ? {
          attending: inv.rsvp.attending,
          guestNames: (inv.rsvp.guestNames as string[]) ?? [],
          mobile: inv.rsvp.mobile,
          updatedAt: inv.rsvp.updatedAt.toISOString(),
        }
      : null,
  }));

  return <Dashboard initial={initial} />;
}
