# Continuidade — Cacamba Smart

> Documento de estado do projeto. Atualizado após fechamento da Etapa 9.1 (CRUD Trocas) com fix de schema crítico em `trocas_status_check`.

---

## 1. Estado atual

**Stack** (sem mudança desde a Etapa 6):
- `next@15.5.15` / `react@19.2.4` / `@supabase/ssr@0.10.2` / `@supabase/supabase-js@2.105.1`
- `eslint-config-next@15.5.15` (com FlatCompat)
- `lucide-react@1.14.0`

**Etapas concluídas e no GitHub:**
- ✅ Etapa 5 — Auth + login + dashboard mínimo
- ✅ Etapa 6 — Sidebar com navegação completa (11 items, 3 seções, mobile drawer)
- ✅ Etapa 7 — CRUD de Containers
- ✅ Etapa 8.1 — CRUD de Clientes (defesa em profundidade Camada A SQL + Camada B código)
- ✅ Etapa 8.2 — CRUD de Motoristas (Supabase Auth admin) + Gate de master no painel
- ✅ Etapa 9.1 — CRUD de Trocas no painel master — **fechada com fix de schema** (ver §2)

**Sidebar** (estado de cada item):
- Dashboard ✅
- Estoque ❌ placeholder
- Atrasados ❌ placeholder
- Containers ✅
- Troca ✅
- Manutenção ❌ placeholder
- Lançar Manut. ❌ placeholder
- Clientes ✅
- Relatórios ❌ placeholder
- Logs ❌ placeholder
- App Motoristas ✅ (CRUD admin web; o app mobile do motorista é uma rota futura separada)

**Branch:** `main` em `ab28cac` (código), com **ALTER TABLE aplicado fora do Git** (ver §2).

---

## 2. Etapa 9.1 — fix de schema crítico

### Bug pego durante teste manual
Cancelamento de troca falhava silenciosamente: UI mostrava "Erro ao marcar troca como cancelada.", troca não persistia como cancelada, containers não eram revertidos.

### Causa raiz
CHECK constraint `trocas_status_check` na tabela `public.trocas` aceitava apenas `'pendente'`, `'aprovada'`, `'rejeitada'` — **`'cancelada'` não estava no array**. Código TypeScript usava `'cancelada'` desde o início da Etapa 9.1, mas o schema não foi alinhado quando a feature de cancelamento foi adicionada. Build passava porque é validação Postgres em runtime, não TypeScript em compile-time.

Erro que vinha do banco: `23514 violates check constraint "trocas_status_check"` — mas a server action `cancelarTroca` retornava string genérica "Erro ao marcar troca como cancelada." sem logar o erro Postgres, então o sintoma ficou opaco até reproduzir o UPDATE direto no SQL Editor.

### Fix aplicado (fora do Git, no Supabase Dashboard)
```sql
ALTER TABLE public.trocas DROP CONSTRAINT trocas_status_check;

ALTER TABLE public.trocas ADD CONSTRAINT trocas_status_check
  CHECK (status = ANY (ARRAY['pendente'::text, 'aprovada'::text, 'rejeitada'::text, 'cancelada'::text]));
```

Verificado via `pg_constraint` — definition agora inclui `'cancelada'::text`.

### Validação pós-fix
Cancelei troca aprovada de 05/05/2026 (Construtora ABC LTDA, retirou #2 entregou #10):
- ✅ Banner verde "Troca cancelada"
- ✅ Status na lista virou "Cancelada" (badge cinza)
- ✅ Filtro "Canceladas" funcionou
- ✅ Containers revertidos: #10 voltou pra `disponivel` + cliente null, #2 voltou pra `em_uso` + Construtora ABC LTDA
- ⚠️ `data_entrega` dos containers não foi limpa no revert — mantém o timestamp da troca cancelada como histórico. Sem impacto funcional (status + cliente_atual_id são as colunas que importam pra lógica), mas pode confundir relatórios futuros. Anotado em débito #4.

---

## 3. Resultado do teste manual da Etapa 9.1

Roteiro de 10 cenários executado parcialmente (cenários não testados podem rodar em qualquer sessão futura, não bloqueiam Etapa 10):

| # | Cenário | Resultado |
|---|---|---|
| 1 | Empty state | ⚠️ Não testável — havia trocas pré-existentes |
| 2 | Primeira entrega | ✅ Linha apareceu, container ficou `em_uso` |
| 3 | Troca clássica (#2 ↔ #10) | ✅ Form salvou, dropdown filtrou containers do cliente corretamente |
| 4 | Retirada final | ⚠️ Form aberto e dropdown OK, **resultado pós-Salvar não verificado** |
| 5a | Validação cliente vazio | ✅ Tooltip HTML5 dispara |
| 5b | Validação data futura | ✅ Banner em vermelho (compara timestamp completo, ver débito #5) |
| 5c | Validação container vazio em modo Troca | ❌ Não testado |
| 6 | Detalhes + edição de observações | ❌ Não testado |
| 7 | Cancelar troca | ✅ **Após fix de schema** — funcionou limpo, containers revertidos |
| 8 | Filtros por status | ✅ Filtro "Canceladas" verificado, outros 4 chips por simetria |
| 9 | Busca por cliente | ❌ Não testado |
| 10 | Gate de master (login como motorista) | ❌ Não testado |

**Cenários não testados (4 final, 5c, 6, 9, 10) podem ser cobertos em qualquer sessão futura** — não bloqueiam próxima etapa. Risco residual baixo; o gate (10) já foi validado em Etapa 8.2 quando foi implementado.

---

## 4. Arquitetura — pontos críticos

### Gate de role no painel
- `(app)/layout.tsx` faz role check direto: se `profile.role !== 'master'`, renderiza tela "use app mobile" em **toda** rota do painel (incluindo `/dashboard`). Fail-closed.
- Defense-in-depth: cada server action sensível chama `requireMaster()` antes de qualquer operação privilegiada.
- Helper compartilhado: `src/app/(app)/_lib/require-master.ts`.

### Multi-tenant
- Todas as tabelas têm `organization_id` com RLS escopando por `current_organization_id()` (function `SECURITY DEFINER` no Supabase, recriada na Etapa 5 pra resolver bug de RLS recursion).
- Server actions **nunca** confiam em `organization_id` vindo do form — sempre buscam via `requireMaster().orgId`.
- Policies de `trocas`: `users_manage_org_trocas` com `cmd = ALL`, `qual = (organization_id = current_organization_id())`, `with_check = NULL` (fallback pro qual). Funcional.

### Cliente Supabase
- Server-side normal (RLS-aware): `src/lib/supabase/server.ts`
- Browser: `src/lib/supabase/client.ts`
- Admin (bypassa RLS, usa `SUPABASE_SERVICE_ROLE_KEY`): `src/lib/supabase/admin.ts` — **só** em server actions privilegiadas (criar usuário em `auth.users`).

### Lógica de Trocas
- Tabela `trocas` armazena `container_retirado_id` e `container_entregue_id` (ambos nullable). Os 3 modos (primeira_entrega, troca, retirada_final) são derivados desses campos no form e re-validados na action.
- Master cadastra direto como `status='aprovada'`, `aprovada_por=user.id`, `aprovada_em=now()`. Workflow de aprovação de motorista (`pendente` → master aprova/rejeita) é etapa futura.
- "Transação" via sequência manual + rollback best-effort (não-ACID) — débito conhecido (#8).
- `createTroca` valida que container a retirar está com `status='em_uso'` E `cliente_atual_id === cliente_id` (defesa contra form manipulado).
- `cancelarTroca` faz revert ingênuo: container retirado → `em_uso` + cliente original, container entregue → `disponivel` + null. **Não considera trocas posteriores afetando os mesmos containers** — risco de inconsistência se cancelar troca antiga depois de operações subsequentes (débito #2).

### Server actions de Trocas — pegadinha de logging
`cancelarTroca` (e provavelmente `createTroca` por simetria) retornam strings de erro genéricas sem logar o `error.code` ou `error.message` do Postgres. Quando bug de schema apareceu, isso atrasou diagnóstico. Considerar adicionar `console.error(error)` antes do return em todas as branches de erro — em produção vai pros logs, em dev aparece no `next dev`.

---

## 5. Débitos técnicos atuais (priorizados)

1. **🟡 Logging em server actions de Trocas** — adicionar `console.error(error)` em todas as branches que retornam erro genérico em `_actions/trocas.ts`. Custo baixo, alto valor em diagnóstico futuro. Fazer junto com qualquer próxima edição naquele arquivo.

2. **🟡 Cancelamento de troca antiga com containers já reutilizados** — `cancelarTroca` não detecta se containers afetados estão em trocas posteriores. Cancelar uma troca antiga pode pôr o banco em estado inconsistente. Solução: ou bloquear cancelamento se há troca posterior afetando os mesmos containers, ou só permitir cancelar a troca mais recente de cada container. Decisão de produto.

3. **JOIN `clientes(nome)`** na coluna "Cliente Atual" da tabela de Containers (TODO desde Etapa 7 em `containers/_components/containers-table.tsx`). Hoje mostra "Cliente vinculado" genérico ou "—". Agora que `clientes` está completo, vale fazer.

4. **`cancelarTroca` não limpa `data_entrega` no container revertido** — mantém o timestamp da troca cancelada. Sem impacto funcional hoje, mas pode confundir relatórios. Resolver junto com débito #2 quando refatorar a lógica de revert.

5. **Validação de data em Trocas é estrita demais** — compara timestamp completo (`Date.now()`), não só date. Cadastrar troca às 14h pra "hoje 16h" é bloqueado. Tolera 5min de drift de relógio. Pode ser intencional (master só registra o que já aconteceu); decisão de produto.

6. **Esconder link "App Motoristas" da sidebar pra non-master** (UX). Hoje motorista vê o link mas o gate redireciona — funcional mas confuso.

7. **Bloquear login de motorista com `ativo=false`** — deactivate marca `ativo=false`, mas login Supabase Auth ainda aceita. Adicionar check no `(app)/layout.tsx` ou no callback de login.

8. **Migrar trocas pra RPC ACID** — `createTroca` e `cancelarTroca` usam sequência manual com rollback best-effort. Race condition em alta concorrência. Solução: criar Postgres function `criar_troca_aprovada(...)` com transação real. Migrar quando virar problema, não antes.

9. **Refatorar pra route groups (Opção 1B)** — quando surgir necessidade de roles intermediários (financeiro, operador, etc), dividir `(app)/` em `(admin)/` + `(common)/`. Custo estimado 30-45 min. Hoje a árvore é flat com gate central no layout.

10. **Cenários não testados da Etapa 9.1** — completar 4 (resultado pós-Salvar de retirada final), 5c, 6, 9, 10 quando houver oportunidade. Risco residual baixo.

---

## 6. Próximos passos candidatos (ordem por valor + custo)

1. **JOIN clientes em containers** (15-20 min) — débito antigo pequeno, melhora UX da tabela de containers.
2. **Etapa 10 — Manutenção + Lançar Manut.** (várias horas) — 2 telas relacionadas, próxima etapa natural do produto.
3. **Logging em server actions de Trocas** (10 min) — débito #1, fazer enquanto contexto está fresco.
4. **Esconder link da sidebar pra non-master** (15 min) — polimento UX.
5. **Atrasados** (várias horas) — filtragem de containers há muito tempo num cliente.
6. **App Motoristas mobile** (várias horas, mais complexo) — rota separada, requer planejamento de fluxo motorista.
7. **Estoque, Relatórios, Logs** — telas placeholder ainda.

---

## 7. Bookmarks

- **Profile master logado:** `smartplanilha2@gmail.com` — `id: 8b686d17-79c6-4f5c-8b24-dcb14d93cfd7` — `organization_id: fbe548c7-909e-4d43-ae00-2250b1bd6374` — `role: master`
- **Motorista de teste:** Pedro Silva (cadastrado durante Etapa 8.2)
- **Supabase project ref:** `rsaelamvnrhtvpkeyxvg`
- **Repositório:** https://github.com/smartcontainer26/cacamba-smart
- **`current_organization_id()` no Supabase:** function `SECURITY DEFINER`
- **Índice criado (Etapa 8.1):** `clientes_org_documento_uniq` (UNIQUE parcial em `public.clientes`)
- **Constraint corrigido (Etapa 9.1):** `trocas_status_check` agora inclui `'cancelada'`
- **`requireMaster` helper:** `src/app/(app)/_lib/require-master.ts`
- **`admin.ts`:** `src/lib/supabase/admin.ts` (criado na Etapa 8.2, usa `SUPABASE_SERVICE_ROLE_KEY` do `.env.local`)

---

## 8. Schema confirmado

### `public.profiles`
14 colunas: `id, organization_id, nome (NOT NULL), email (NOT NULL), telefone, role (NOT NULL), ativo (NOT NULL), created_at, updated_at` (+ outras menores)

### `public.clientes`
14 colunas com `nome, documento, telefone, email, endereco, cidade, estado, observacoes, ativo`. UNIQUE INDEX parcial em `(organization_id, documento) WHERE documento IS NOT NULL`.

### `public.containers`
Schema básico: `numero, tipo, status, cliente_atual_id, data_entrega, observacoes, ativo`. Status enum: `'disponivel' | 'em_uso' | 'manutencao' | 'inativo'`.

### `public.trocas`
14 colunas: `id, organization_id, motorista_id (nullable), cliente_id (NOT NULL), container_retirado_id (nullable), container_entregue_id (nullable), observacoes, status (NOT NULL), aprovada_por (nullable), aprovada_em (nullable), motivo_rejeicao (nullable), data_troca (NOT NULL), created_at, updated_at`. **Status CHECK constraint:** `'pendente' | 'aprovada' | 'rejeitada' | 'cancelada'` (corrigido nesta sessão). RLS policy `users_manage_org_trocas` com `cmd = ALL` e `qual = (organization_id = current_organization_id())`.
