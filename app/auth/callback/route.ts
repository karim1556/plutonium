import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  const env = getSupabasePublicEnv();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  const invite = url.searchParams.get("invite");

  if (!env || !code) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const response = NextResponse.redirect(new URL(invite ? `/connections?invite=${invite}` : next, url.origin));

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  await supabase.auth.exchangeCodeForSession(code);
  return response;
}
