import { createClient } from "@supabase/supabase-js";

import { publicEnv, serverEnv } from "@/env";

export function createSupabaseAdminClient() {
  return createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}
