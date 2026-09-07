import { InvitePage } from "@/components/guest/InvitePage";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <InvitePage locale={locale} invitation={null} existingRsvp={null} />;
}
