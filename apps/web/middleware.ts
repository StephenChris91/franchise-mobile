import { auth } from "./auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAuthenticated = !!session?.user;
  const approvalStatus = session?.user?.approvalStatus;
  const role = session?.user?.role;

  // ── Unauthenticated: redirect to login ───────────────────────────────────
  if (!isAuthenticated) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // ── Pending approval: allow only /auth/* and /api/auth/* ─────────────────
  if (
    approvalStatus === "pending" &&
    !pathname.startsWith("/auth/") &&
    !pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.redirect(new URL("/auth/pending", req.url));
  }

  // ── Rejected: redirect to rejected page ──────────────────────────────────
  if (
    approvalStatus === "rejected" &&
    !pathname.startsWith("/auth/") &&
    !pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.redirect(new URL("/auth/rejected", req.url));
  }

  // ── Admin-only routes ─────────────────────────────────────────────────────
  if (
    pathname.startsWith("/admin") &&
    role !== "admin" &&
    role !== "pastor"
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/social/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
