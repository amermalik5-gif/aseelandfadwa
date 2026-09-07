import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";
import { newInviteCode } from "@/lib/codes";
import { parseGuestSheet } from "@/lib/excel";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let file: File | null = null;
  try {
    const form = await req.formData();
    const entry = form.get("file");
    if (entry instanceof File) file = entry;
  } catch {
    // handled below
  }
  if (!file) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  let rows;
  try {
    rows = parseGuestSheet(Buffer.from(await file.arrayBuffer()));
  } catch {
    return NextResponse.json({ error: "unreadable file" }, { status: 422 });
  }

  const existing = await prisma.invitation.findMany({ select: { name: true } });
  const seen = new Set(existing.map((i) => i.name.trim().toLowerCase()));

  let added = 0;
  let skipped = 0;
  const toCreate: { name: string; maxGuests: number; phone: string | null; code: string }[] = [];

  for (const row of rows) {
    const key = row.name.trim().toLowerCase();
    if (!key || seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);
    toCreate.push({ ...row, code: newInviteCode() });
    added++;
  }

  if (toCreate.length > 0) {
    await prisma.invitation.createMany({ data: toCreate });
  }

  return NextResponse.json({ added, skipped, total: rows.length });
}
