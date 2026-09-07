import { isAdmin } from "@/lib/adminSession";
import { prisma } from "@/lib/prisma";
import { reminderMessageDefault, waMessageDefault } from "@/config/event";
import { LoginForm } from "@/components/dashboard/LoginForm";
import { Dashboard } from "@/components/dashboard/Dashboard";
import type { InvitationDto } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!(await isAdmin())) {
    return <LoginForm />;
  }

  const [invitations, settings] = await Promise.all([
    prisma.invitation.findMany({
      include: { rsvp: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.setting.findMany({
      where: { key: { in: ["waTemplate", "reminderTemplate"] } },
    }),
  ]);
  const settingOf = (key: string) =>
    settings.find((s) => s.key === key)?.value;

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
          guestCount: inv.rsvp.guestCount,
          mobile: inv.rsvp.mobile,
          updatedAt: inv.rsvp.updatedAt.toISOString(),
        }
      : null,
  }));

  return (
    <Dashboard
      initial={initial}
      waTemplateInitial={settingOf("waTemplate") ?? waMessageDefault}
      reminderTemplateInitial={
        settingOf("reminderTemplate") ?? reminderMessageDefault
      }
    />
  );
}
