import { describe, expect, it } from "vitest";
import { authMiddleware } from "./auth-middleware";

function createRequest(pathname: string, loggedIn = false): any {
  return {
    url: "http://localhost:3002" + pathname,
    nextUrl: { pathname },
    cookies: {
      get: (name: string) => (loggedIn && name === "auth-token" ? { value: "x" } : undefined),
    },
  };
}

describe("authMiddleware", () => {
  it("redirects unauthenticated users away from protected routes", () => {
    const req = createRequest("/business/dashboard");
    const res = authMiddleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3002/auth/v1/login");
  });

  it("redirects authenticated users away from login route", () => {
    const req = createRequest("/auth/v1/login", true);
    const res = authMiddleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3002/business/dashboard");
  });

  it("allows unauthenticated users on public auth routes", () => {
    const req = createRequest("/auth/v1/register");
    const res = authMiddleware(req);

    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});
