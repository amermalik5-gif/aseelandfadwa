import { NextResponse } from "next/server";
import { isAdmin } from "./adminSession";

/** Returns a 401 response if the request has no valid admin session, else null. */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isAdmin()) return null;
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
