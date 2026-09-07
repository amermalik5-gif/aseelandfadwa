import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;

  let body: { name?: unknown; maxGuests?: unknown; phone?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const data: { name?: string; maxGuests?: number; phone?: string | null } = {};
  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim().slice(0, 160);
  }
  if (body.maxGuests !== undefined) {
    const n = Number(body.maxGuests);
    if (Number.isFinite(n) && n >= 1) data.maxGuests = Math.min(Math.floor(n), 50);
  }
  if (body.phone !== undefined) {
    data.phone =
      typeof body.phone === "string" && body.phone.trim()
        ? body.phone.trim().slice(0, 24)
        : null;
  }

  try {
    const invitation = await prisma.invitation.update({
      where: { id },
      data,
      include: { rsvp: true },
    });
    return NextResponse.json({ invitation });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;

  try {
    await prisma.invitation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
