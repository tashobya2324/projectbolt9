"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client for the dashboard UI. Falls back to a placeholder project so the
 * app renders (with empty states) before NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are set.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  return createBrowserClient(url, anonKey);
}
