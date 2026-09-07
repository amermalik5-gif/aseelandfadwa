import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { makeSessionToken, sessionCookie } from "@/lib/adminSession";

function safeEquals(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export async function POST(req: NextRequest) {
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }

  let password = "";
  try {
    const body = await req.json();
    if (typeof body?.password === "string") password = body.password;
  } catch {
    // fall through to failed comparison
  }

  if (!password || !safeEquals(password, expected)) {
    return NextResponse.json({ error: "wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookie(makeSessionToken()));
  return res;
}
