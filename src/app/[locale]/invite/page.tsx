import { InvitePage } from "@/components/guest/InvitePage";

// One shareable link for everyone: the full invitation without the RSVP part.
export default async function GenericInvite({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <InvitePage locale={locale} invitation={null} existingRsvp={null} generic />
  );
}
