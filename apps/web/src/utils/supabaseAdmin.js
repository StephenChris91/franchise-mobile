// utils/supabaseAdmin.js
import { createClient } from "@supabase/supabase-js";

// Lazy singleton so the Supabase client isn't initialized at module load time
// (prevents build errors when env vars are absent)
let _client = null;

export const supabaseAdmin = new Proxy({}, {
  get(_, prop) {
    if (!_client) {
      _client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
    }
    return _client[prop];
  }
});
