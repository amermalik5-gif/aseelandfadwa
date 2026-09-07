import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { InvitePage } from "@/components/guest/InvitePage";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export default async function RsvpByCode({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { code },
    include: { rsvp: true },
  });

  if (invitation && !invitation.viewedAt) {
    // record the first time this invitation was opened
    try {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { viewedAt: new Date() },
      });
    } catch {
      // non-critical; the page must render regardless
    }
  }

  if (!invitation) {
    const t = await getTranslations({ locale, namespace: "invalid" });
    return (
      <main className="hero-vignette flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center text-cream">
        <h1 className="type-display text-3xl">{t("title")}</h1>
        <p className="max-w-sm text-sm leading-relaxed text-cream-dim">
          {t("body")}
        </p>
        <Link
          href="/"
          className="tracked mt-2 border border-cream/45 px-6 py-3 text-xs text-cream transition-colors hover:bg-cream hover:text-olive-950"
        >
          {t("cta")}
        </Link>
      </main>
    );
  }

  const existingRsvp = invitation.rsvp
    ? {
        attending: invitation.rsvp.attending,
        mobile: invitation.rsvp.mobile,
      }
    : null;

  return (
    <InvitePage
      locale={locale}
      invitation={{
        code: invitation.code,
        name: invitation.name,
        maxGuests: invitation.maxGuests,
      }}
      existingRsvp={existingRsvp}
    />
  );
}
