import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { buildTemplate } from "@/lib/excel";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  return new NextResponse(new Uint8Array(buildTemplate()), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="guest-list-template.xlsx"',
    },
  });
}
