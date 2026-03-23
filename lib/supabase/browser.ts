"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/config";

let client: SupabaseClient | null = null;

export function createBrowserSupabaseClient() {
  if (client) {
    return client;
  }

  const env = getSupabasePublicEnv();

  if (!env) {
    return null;
  }

  client = createBrowserClient(env.url, env.anonKey);
  return client;
}
