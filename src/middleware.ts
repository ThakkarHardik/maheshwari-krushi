import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/jwt";

/**
 * First line of defence for /admin: redirects visitors without a valid
 * session token. Pages and actions still call requireAdmin(), which checks
 * the database and the role.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  const isLogin = pathname === "/admin/login";

  if (!session && !isLogin) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (session && isLogin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
