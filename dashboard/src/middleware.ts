// middleware.ts (place at project root)
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "./middleware/auth-middleware";

export function middleware(req: NextRequest) {
  // call authMiddleware from ./middleware/auth-middleware
  const response = authMiddleware(req);
  if (response) return response;
  return NextResponse.next();
}

// matcher: only run middleware for auth and dashboard routes (adjust if you need extra routes)
export const config = {
  matcher: [
    "/app/main/dashboard/:path*",      // protect all dashboard routes
    "/app/main/auth/:path*",           // allow/handle auth routes
  ],
};
