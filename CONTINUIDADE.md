# Continuidade — Cacamba Smart

> Documento de estado do projeto. Atualizado em **2026-04-30** após resolução dos bloqueios da Etapa 5.

---

## 1. Estado atual

**Stack rodando:**
- `next@15.5.15` (downgrade do 16.2.4)
- `react@19.2.4` / `react-dom@19.2.4`
- `@supabase/ssr@0.10.2`
- `@supabase/supabase-js@2.105.1`
- `eslint-config-next@15.5.15`

**O que funciona:**
- Login autentica corretamente no Supabase Auth.
- Middleware (`src/middleware.ts`) roda e aplica redirects auth-aware.
- `auth.getUser()` no server component retorna o usuário certo.
- Build de produção compila limpo (3.9s, 7 páginas estáticas, middleware 89.2 kB).
- Dev server sobe sem erro de runtime.

**O que falta validar:**
- Dashboard renderizando "Bem-vindo, Henryque" com profile real (após o fix SQL do bug 1 e o downgrade do bug 2). Esse é o próximo passo manual.

---

## 2. Bugs resolvidos nesta sessão

### Bug 1 — RLS recursion (`infinite recursion detected in policy for relation "profiles"`) ✅ RESOLVIDO
- **Sintoma:** dashboard mostrava "Conta não vinculada" mesmo com profile existindo no banco.
- **Causa real:** policy de `profiles` chamava função/subquery que fazia `SELECT FROM profiles`, reaplicando RLS → loop. Postgres abortava com código `42P17`.
- **Diagnóstico:** confirmado via `curl` direto na REST do Supabase com anon key (HTTP 500 + payload com `42P17`). O erro vinha sendo invisível porque `PostgrestError` herda de `Error` e `message`/`stack` são não-enumeráveis — `JSON.stringify` no logger do Next cuspia `{}`.
- **Fix aplicado:** SQL no Supabase (recriação de `current_organization_id()` com `SECURITY DEFINER` blindado e ajuste das policies que recursavam).
- **Onde verificar:** rodar `SELECT * FROM public.profiles WHERE id = auth.uid()` no SQL Editor não dá mais erro `42P17`.

### Bug 2 — `adapterFn is not a function` ✅ RESOLVIDO
- **Sintoma:** erro de runtime ao carregar qualquer página, no Next 16.2.4 + Turbopack.
- **Causa:** incompatibilidade do `@supabase/ssr@0.10.x` com Next 16. O termo "adapter" é vocabulário interno do `@supabase/ssr` pra cookie storage — uma assinatura mudou no Next 16 e os adapters da 0.10.x tentavam invocar uma função inexistente.
- **Fix aplicado:** downgrade pra `next@15.5.15` (linha 15.5 estável que `@supabase/ssr@0.10` suporta oficialmente).
- **Mudanças estruturais que vieram junto:**
  - `src/proxy.ts` → `src/middleware.ts` (export `middleware()` em vez de `proxy()`)
  - `src/lib/supabase/proxy.ts` → `src/lib/supabase/middleware.ts` (helper interno renomeado pra manter vocabulário)
  - `package.json`: `next` e `eslint-config-next` pinados em `^15.5.0`
  - `eslint.config.mjs`: imports com `.js` explícito (`eslint-config-next/core-web-vitals.js` etc) — exigência do `eslint-config-next@15`

---

## 3. Débito técnico anotado

### ESLint flat config quebrado
- **Sintoma:** `npm run build` mostra `⨯ ESLint: nextVitals is not iterable` durante a fase de lint. Build segue adiante e gera artefatos normalmente — **não bloqueia dev nem produção**.
- **Causa:** `eslint-config-next@15.5.x` exporta seus subpaths (`core-web-vitals.js`, `typescript.js`) como **objeto único** (formato legacy), não como array de configs flat. O `eslint.config.mjs` atual faz `...nextVitals` / `...nextTs` esperando array.
- **Caminhos pra resolver depois (em ordem de preferência):**
  1. Usar `FlatCompat` do `@eslint/eslintrc` pra adaptar legacy → flat config.
  2. Voltar pro `.eslintrc.json` legacy (deletar `eslint.config.mjs`).
  3. `eslint: { ignoreDuringBuilds: true }` em `next.config.ts` se a chatice for só na build.
- **Quando atacar:** quando começarmos a depender de lint em CI ou pre-commit hook. Por enquanto, sem urgência.

### Logs de debug ainda ativos no dashboard
- `src/app/(app)/dashboard/page.tsx` ainda tem `console.error` + `throw new Error(...)` no caso de `profileError`. Esse tratamento foi colocado pra fazer erros de banco (RLS, schema, etc) aparecerem em vez de cair em "Conta não vinculada" silenciosamente.
- **Decisão a tomar depois:** manter como tratamento permanente, ou trocar por uma error boundary com UI dedicada quando o app crescer.

---

## 4. Próximos passos (em ordem)

1. **Testar dashboard agora** — `npm run dev` está sendo iniciado. Login com `smartplanilha2@gmail.com` e ver se renderiza "Bem-vindo, Henryque" + "Perfil: master".
2. **Etapa 6** — layout autenticado com sidebar (escopo da próxima sessão).
3. **Resolver débito do ESLint** (sem urgência — quando for setar CI ou pre-commit).
4. **Commit inicial do projeto** (staging já está pronto da sessão anterior, mas vai precisar incluir as mudanças desta sessão também).

---

## 5. Arquivos modificados nesta sessão

- `package.json` — pin de `next` e `eslint-config-next` em `^15.5.0`.
- `package-lock.json` — regenerado (`npm install` do zero).
- `eslint.config.mjs` — adicionado `.js` aos 2 imports do `eslint-config-next`.
- `src/middleware.ts` — **novo** (substitui `src/proxy.ts`).
- `src/lib/supabase/middleware.ts` — **novo** (substitui `src/lib/supabase/proxy.ts`).
- `src/proxy.ts` — **deletado**.
- `src/lib/supabase/proxy.ts` — **deletado**.
- `src/app/(app)/dashboard/page.tsx` — tratamento de `profileError` (mantido da sessão anterior).
- `AGENTS.md` — atualizado pra refletir Next 15 estável.
- `CONTINUIDADE.md` — este arquivo.

---

## 6. Bookmarks

- Profile real (smartplanilha2):
  - `id`: `8b686d17-79c6-4f5c-8b24-dcb14d93cfd7`
  - `organization_id`: `fbe548c7-909e-4d43-ae00-2250b1bd6374`
  - `email`: `smartplanilha2@gmail.com`
  - `role`: `master`
- Supabase project ref: `rsaelamvnrhtvpkeyxvg`
- Log do dev (server console capturado): `.next/dev/logs/next-development.log` *(esse caminho era do Next 16; no Next 15 o `next dev` loga direto no terminal — não há mais esse arquivo persistente).*
