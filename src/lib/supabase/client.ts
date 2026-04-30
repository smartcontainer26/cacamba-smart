// =============================================================================
// Cliente Supabase para uso no NAVEGADOR (componentes client-side)
// =============================================================================
// Usado em componentes marcados com "use client"
// O usuário logado se autentica aqui, com permissões dele (RLS aplica)
// =============================================================================

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
