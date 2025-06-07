import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const isAuthenticated = !!token;
  
  const isAuthPage = 
    req.nextUrl.pathname.startsWith("/sign-in") || 
    req.nextUrl.pathname.startsWith("/sign-up");

  const isAdminPage = req.nextUrl.pathname.startsWith("/dashboard/admin");
  const isUserPage = 
    req.nextUrl.pathname.startsWith("/dashboard") || 
    req.nextUrl.pathname.startsWith("/profile");

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect unauthenticated users to sign-in page
  if (!isAuthenticated && (isUserPage || isAdminPage)) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Check for admin role on admin pages
  if (isAuthenticated && isAdminPage && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
