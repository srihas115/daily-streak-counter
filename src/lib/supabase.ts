import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS. Safe here because this app has no auth —
// the streak slug in the URL is the only "credential", same trust model as
// the original KV-per-path design. Never expose this key to the browser.
let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
  }

  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return client;
}
