import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  // Guest pages are Arabic-only; old /en links land on the Arabic version.
  // The admin dashboard keeps its English option.
  const { pathname } = request.nextUrl;
  if (
    (pathname === "/en" || pathname.startsWith("/en/")) &&
    !pathname.startsWith("/en/dashboard")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/ar" + pathname.slice(3);
    return NextResponse.redirect(url, 308);
  }
  return intl(request);
}

export const config = {
  // Skip API routes, Next internals and any file with an extension
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
