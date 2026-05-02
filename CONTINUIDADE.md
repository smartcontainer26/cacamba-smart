# Continuidade — Cacamba Smart

> Documento de estado do projeto. Atualizado após fix do bug de duplicidade em Clientes.

---

## 1. Estado atual

**Stack** (sem mudança desde a Etapa 6):
- `next@15.5.15` / `react@19.2.4` / `@supabase/ssr@0.10.2` / `@supabase/supabase-js@2.105.1`
- `eslint-config-next@15.5.15` (com FlatCompat)
- `lucide-react@1.14.0`

**Etapas concluídas e no GitHub:**
- ✅ Etapa 5 — Auth + login + dashboard mínimo
- ✅ Etapa 6 — Sidebar com navegação completa (11 items, 3 seções, mobile drawer)
- ✅ Etapa 7 — CRUD de Containers funcional
- 🟡 Etapa 8 — **Em progresso**:
  - ✅ Parte 1 (CRUD Clientes) — funcional, **bug de duplicidade RESOLVIDO** (commits `8196f46` + `9e166dc` + Camada A no Supabase)
  - ❌ Parte 2 (CRUD Motoristas) — **não iniciada**

---

## 2. Bug de validação de documento duplicado em Clientes ✅ RESOLVIDO

### Sintoma original
Cadastrar 2 clientes com mesmo `documento` (ex: "123.456.789-00") na mesma organization era aceito sem erro. Esperado: erro inline "Já existe um cliente com esse documento."

### Causa raiz
A validação no código dependia de erro `23505` (UNIQUE violation) do Postgres, mas a tabela `public.clientes` **não tinha** UNIQUE constraint em `(organization_id, documento)` — passava silenciosamente.

### Fix em 2 camadas (defesa em profundidade) — AMBAS APLICADAS

**Camada B — código** (✅ commitada em `9e166dc`):
- `createCliente`: SELECT pré-INSERT bloqueia se já existe cliente com mesmo doc na org (RLS escopa).
- `updateCliente`: SELECT pré-UPDATE com `.neq("id", id)` (não bloqueia o próprio registro).
- Doc null/vazio segue permitido em múltiplos clientes.
- Captura primeiro, antes do banco — gera mensagem amigável imediata.

**Camada A — DB UNIQUE INDEX parcial** (✅ aplicada no Supabase, fora do Git):
```sql
CREATE UNIQUE INDEX clientes_org_documento_uniq
  ON public.clientes (organization_id, documento)
  WHERE documento IS NOT NULL;
```
Verificada via `pg_indexes` (1 linha retornada). Cobre race conditions caso 2 requests passem do check da Camada B simultaneamente — o catch do `error.code === "23505"` no código entra em ação como segunda mensagem amigável.

### Validação em produção
Cadastrei "Teste Duplicado" com `123.456.789-00` (mesmo doc do "João Silva" existente) → recebi mensagem inline **"Já existe um cliente com esse documento."** → cliente NÃO foi criado. Camada B interceptou antes do hit no banco. Comportamento esperado.

---

## 3. Próximos passos (ordem)

1. **Pré-checagem da Parte 2 (Motoristas):** confirmar que `SUPABASE_SERVICE_ROLE_KEY` foi adicionada em `.env.local`. Sem isso, criar usuário em `auth.users` é impossível. Pegar em https://supabase.com/dashboard/project/rsaelamvnrhtvpkeyxvg/settings/api → seção *Project API keys* → valor `service_role`.
2. **Iniciar Parte 2 (CRUD Motoristas)** — plano detalhado já apresentado e aprovado em sessão anterior. Resumo:
   - Cria `src/lib/supabase/admin.ts` (cliente service-role; arquivo NOVO, não toca client.ts/server.ts)
   - 10 arquivos sob `src/app/(app)/motoristas/` (mesmo padrão de Containers/Clientes)
   - `createMotorista` chama `admin.auth.admin.createUser` + INSERT em profiles, com rollback se falhar
   - Listagem filtra `profiles WHERE role='motorista'`
   - Soft delete (`UPDATE profiles SET ativo=false`); NÃO apaga de `auth.users`
   - Defense-in-depth: action verifica que caller é `role='master'` antes de criar
3. **Etapa 9 ou débito**: opções pra próximas sessões: a) JOIN clientes(nome) na tabela de Containers (TODO da Etapa 7); b) etapas seguintes do produto (estoque, atrasados, manutenção, etc); c) atacar débito ESLint se for setar CI/pre-commit.

---

## 4. Débitos técnicos atuais (priorizados)

1. **`SUPABASE_SERVICE_ROLE_KEY` no `.env.local`** (bloqueia Parte 2 — Motoristas).
2. **JOIN `clientes(nome)`** na coluna "Cliente Atual" da tabela de Containers (TODO comment em `containers/_components/containers-table.tsx`). Hoje mostra "Cliente vinculado" genérico ou "—".
3. **ESLint flat config** — resolvido com FlatCompat na Etapa 6/7. Sem débito ativo.

---

## 5. Bookmarks

- Profile real (master logado): `smartplanilha2@gmail.com` — `id: 8b686d17-79c6-4f5c-8b24-dcb14d93cfd7` — `organization_id: fbe548c7-909e-4d43-ae00-2250b1bd6374` — `role: master`
- Supabase project ref: `rsaelamvnrhtvpkeyxvg`
- Repositório: https://github.com/smartcontainer26/cacamba-smart
- `current_organization_id()` no Supabase: function `SECURITY DEFINER` (recriada na sessão da Etapa 5 pra resolver o bug de RLS recursion).
- Índice criado nesta sessão: `clientes_org_documento_uniq` (UNIQUE parcial em `public.clientes`).
