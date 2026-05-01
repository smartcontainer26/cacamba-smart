// =============================================================================
// Middleware do Next.js
// =============================================================================
// Roda antes de cada requisição (matcher abaixo).
// Delega pro helper updateSession que cuida de auth + redirects do Supabase.
// =============================================================================

import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Roda em todas as rotas exceto: rotas /api, assets do Next, favicon
  // e arquivos de imagem comuns.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
