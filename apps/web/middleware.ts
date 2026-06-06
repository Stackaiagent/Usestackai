import { auth } from "@/auth";
import { NextResponse } from "next/server";

/** Protect /dashboard and /vibe — redirect to /login when unauthenticated. */
export default auth((req) => {
  const isProtected =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/vibe");

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/vibe/:path*"],
};
