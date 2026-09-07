import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminGuard";

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { waTemplate?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  if (typeof body.waTemplate !== "string" || !body.waTemplate.trim()) {
    return NextResponse.json({ error: "waTemplate required" }, { status: 400 });
  }
  const value = body.waTemplate.trim().slice(0, 1500);

  await prisma.setting.upsert({
    where: { key: "waTemplate" },
    create: { key: "waTemplate", value },
    update: { value },
  });

  return NextResponse.json({ ok: true, waTemplate: value });
}
