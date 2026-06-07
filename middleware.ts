import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Build a minimal NextAuth instance from the edge-safe config only (no Prisma),
// so the middleware bundle stays edge-compatible.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Run on everything except NextAuth's own API, the login page, Next internals,
  // and static assets.
  matcher: [
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
