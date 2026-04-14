// ./middleware/auth-middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function authMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isLoggedIn =
    !!req.cookies.get("auth-token") ||
    !!req.cookies.get("sb-access-token") ||
    !!req.cookies.get("sb-refresh-token");

  const login = "/auth/v1/login";
  const register = "/auth/v1/register";
  const dashboardRoot = "/business/dashboard";
  const protectedPrefixes = ["/admin", "/business"];

  const publicRoutes = [login, register];

  // If the path starts with one of the public route prefixes, allow it
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // If logged-in user tries to access login/register, redirect to dashboard
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(dashboardRoot, req.url));
    }
    return NextResponse.next();
  }

  // If user not logged in and trying to access protected areas -> redirect to login
  if (
    !isLoggedIn &&
    protectedPrefixes.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.redirect(new URL(login, req.url));
  }

  // If logged in and going to login page -> send to dashboard
  if (isLoggedIn && pathname === login) {
    return NextResponse.redirect(new URL(dashboardRoot, req.url));
  }

  return NextResponse.next();
}
