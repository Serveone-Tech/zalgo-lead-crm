import { NextResponse } from "next/server";

// Powers a second, marketing-only deployment of this same Next.js app on a
// separate domain, without splitting the codebase. When that instance is
// started with MARKETING_ONLY=1, every request outside the public
// marketing pages below (the app's own routes — /login, /dashboard,
// /leads, etc.) redirects to the real product domain instead of being
// served here, so the CRM itself only ever runs on one origin. The main
// deployment (lead-management.zalgostore.com) never sets this env var, so
// this middleware is a no-op there — full app, same as today.
const MARKETING_PATHS = new Set([
  "/",
  "/features",
  "/solutions",
  "/automation-suite",
  "/pricing",
  "/contact",
  "/docs",
  "/terms",
  "/privacy",
  "/refund-policy",
  "/help-center",
  "/about",
]);

const APP_ORIGIN = "https://lead-management.zalgostore.com";

export function middleware(req) {
  if (process.env.MARKETING_ONLY !== "1") return NextResponse.next();

  const { pathname, search } = req.nextUrl;

  // Next's own asset/data requests and anything that looks like a static
  // file (favicon.png, logo_*.png, robots.txt, ...) are always allowed —
  // only page navigations are gated.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    MARKETING_PATHS.has(pathname) ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  return NextResponse.redirect(`${APP_ORIGIN}${pathname}${search}`);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
