<!-- BEGIN:nextjs-agent-rules -->
# Next.js conventions

Stack: **Next 15.5 (App Router) + React 19 + @supabase/ssr 0.10.x**.

A versão é estável e bem documentada — você provavelmente já conhece. Pontos do projeto que valem lembrar:

- Middleware fica em `src/middleware.ts` (export `middleware()`).
- `cookies()` de `next/headers` é **async** desde Next 15: sempre `await cookies()`.
- Server Components não podem **setar** cookies — só ler. Setar cookies só em Server Actions ou Route Handlers (o helper `src/lib/supabase/server.ts` envolve a tentativa em try/catch por isso).
- Quando precisar conferir API exata, há cópia local da doc em `node_modules/next/dist/docs/`.
<!-- END:nextjs-agent-rules -->
