import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { protectedPaths } from "@/lib/auth";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

function matchesPath(pathname: string, entries: string[]) {
  return entries.some((entry) => pathname === entry || pathname.startsWith(`${entry}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!matchesPath(pathname, protectedPaths)) {
    return NextResponse.next();
  }

  const response = await updateSupabaseSession(request);

  if (!request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/patient/:path*",
    "/caregiver/:path*",
    "/connections/:path*",
    "/upload/:path*",
    "/schedule/:path*",
    "/analytics/:path*",
    "/chat/:path*",
    "/device/:path*"
  ]
};
