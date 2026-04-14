// proxy.ts (place at project root or src/)
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "./middleware/auth-middleware";

export function proxy(req: NextRequest) {
  // call authMiddleware from ./middleware/auth-middleware
  const response = authMiddleware(req);
  if (response) return response;
  return NextResponse.next();
}

// matcher: only run proxy for auth and dashboard routes (adjust if you need extra routes)
export const config = {
  matcher: ["/auth/:path*", "/admin/:path*", "/business/:path*"],
};
