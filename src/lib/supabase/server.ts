// =============================================================================
// Cliente Supabase para uso no SERVIDOR (server components, API routes)
// =============================================================================
// Usado em componentes server-side e rotas de API
// Lê cookies da requisição pra saber qual usuário está logado
// =============================================================================

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component pode não permitir setar cookies, ignora
          }
        },
      },
    }
  )
}