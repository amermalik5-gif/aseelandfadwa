import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;

  const invitation = await prisma.invitation.findUnique({ where: { id } });
  if (!invitation) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || req.nextUrl.origin;
  const url = `${base}/ar/rsvp/${invitation.code}`;

  const png = await QRCode.toBuffer(url, {
    type: "png",
    width: 640,
    margin: 2,
    color: { dark: "#2c3126", light: "#f4efe4" },
  });

  const safeName = invitation.name.replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "invitation";
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
        `qr-${safeName}.png`
      )}`,
    },
  });
}
