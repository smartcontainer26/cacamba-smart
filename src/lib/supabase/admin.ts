// ATENÇÃO: Use APENAS em Server Components, Server Actions ou Route
// Handlers. NUNCA importe em Client Components — a SERVICE_ROLE_KEY
// bypassa RLS e tem privilégios admin sobre o banco e o auth.users.
//
// Cada chamada cria um cliente novo (sem persistência de sessão).

import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurada.");
  }
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
