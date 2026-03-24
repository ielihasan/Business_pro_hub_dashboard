// ./middleware/auth-middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function authMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // cookie key used to identify logged-in user (change if you use another key)
  const isLoggedIn = !!req.cookies.get("auth-token");

  const login = "/app/main/auth/v1/login";
  const register = "/app/main/auth/v1/register";
  const dashboardRoot = "/app/main/dashboard";

  const publicRoutes = [login, register];

  // If the path starts with one of the public route prefixes, allow it
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // If logged-in user tries to access login/register, redirect to dashboard
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(`${dashboardRoot}/default`, req.url));
    }
    return NextResponse.next();
  }

  // If user not logged in and trying to access dashboard -> redirect to login
  if (!isLoggedIn && pathname.startsWith(dashboardRoot)) {
    return NextResponse.redirect(new URL(login, req.url));
  }

  // If logged in and going to login page -> send to dashboard
  if (isLoggedIn && pathname === login) {
    return NextResponse.redirect(new URL(`${dashboardRoot}/default`, req.url));
  }

  return NextResponse.next();
}
