// ./middleware/auth-middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function authMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // cookie key used to identify logged-in user (change if you use another key)
  const isLoggedIn = !!req.cookies.get("auth-token");

  // set the canonical auth routes you actually have in your app
  const loginV1 = "/app/main/auth/v1/login";
  const registerV1 = "/app/main/auth/v1/register";
  const loginV2 = "/app/main/auth/v2/login";
  const registerV2 = "/app/main/auth/v2/register";
  const dashboardRoot = "/app/main/dashboard";

  // Public routes (allow these without auth)
  const publicRoutes = [loginV1, registerV1, loginV2, registerV2];

  // If the path starts with one of the public route prefixes, allow it
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // If logged-in user tries to access login/register, redirect to dashboard
    if (isLoggedIn && publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL(`${dashboardRoot}/default`, req.url));
    }
    return NextResponse.next();
  }

  // If user not logged in and trying to access dashboard -> redirect to login (v2 preferred)
  if (!isLoggedIn && pathname.startsWith(dashboardRoot)) {
    return NextResponse.redirect(new URL(loginV2, req.url));
  }

  // If logged in and going to exact login page -> send to dashboard
  if (isLoggedIn && (pathname === loginV2 || pathname === loginV1)) {
    return NextResponse.redirect(new URL(`${dashboardRoot}/default`, req.url));
  }

  return NextResponse.next();
}
