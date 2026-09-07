import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { newInviteCode } from "@/lib/codes";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const invitations = await prisma.invitation.findMany({
    include: { rsvp: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ invitations });
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let ids: string[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.ids)) {
      ids = body.ids.filter((v: unknown): v is string => typeof v === "string");
    }
  } catch {
    // handled below
  }
  if (ids.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }

  const result = await prisma.invitation.deleteMany({
    where: { id: { in: ids.slice(0, 500) } },
  });
  return NextResponse.json({ deleted: result.count });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { name?: unknown; maxGuests?: unknown; phone?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 160) : "";
  const rawCount = Number(body.maxGuests);
  const maxGuests =
    Number.isFinite(rawCount) && rawCount >= 1
      ? Math.min(Math.floor(rawCount), 50)
      : 1;
  const phone =
    typeof body.phone === "string" && body.phone.trim()
      ? body.phone.trim().slice(0, 24)
      : null;

  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const invitation = await prisma.invitation.create({
    data: { name, maxGuests, phone, code: newInviteCode() },
    include: { rsvp: true },
  });
  return NextResponse.json({ invitation }, { status: 201 });
}
