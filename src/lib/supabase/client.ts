import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

let _client: ReturnType<typeof createClient> | null = null;
export function getSupabaseClient() {
  if (!_client) _client = createClient();
  return _client;
}
