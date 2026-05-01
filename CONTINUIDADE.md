# Continuidade — Cacamba Smart

> Documento de estado do projeto. **Fim da sessão atual** (após Etapa 8 parcial). Atualizado em 2026-04-30.

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
  - Parte 1 (CRUD Clientes): commitado em `8196f46` — funcional, **com bug pendente**
  - Parte 2 (CRUD Motoristas): **não iniciada**

**Branch:** `main`, sincronizada com `origin/main`. Último commit: `9e166dc` (wip do bug fix parcial).

---

## 2. Bug pendente — validação de documento duplicado em Clientes

### Sintoma
Cadastrar 2 clientes com mesmo `documento` (ex: "123.456.789-00") na mesma organization é aceito sem erro. Esperado: erro inline "Já existe um cliente com esse documento."

### Reprodução conhecida no banco
Já existem 2 duplicatas no banco da reprodução do bug:
- "João Silva" — `123.456.789-00`
- "Smartplanilha" — `123.456.789-00`

### Causa raiz
A validação no código depende de erro `23505` (UNIQUE violation) do Postgres, **mas a tabela `public.clientes` não tem UNIQUE constraint em `(organization_id, documento)`** — passou silenciosamente.

### Fix em 2 camadas (defesa em profundidade)

**Camada B — código (✅ aplicada e commitada em `9e166dc`):**
- `createCliente`: SELECT pré-INSERT bloqueia se já existe cliente com mesmo doc na org (RLS escopa).
- `updateCliente`: SELECT pré-UPDATE com `.neq("id", id)` (não bloqueia o próprio registro).
- Doc null/vazio segue permitido em múltiplos clientes.
- O catch de `error.code === "23505"` foi mantido como segunda camada (vai pegar caso a Camada A entre depois).
- Limitação: tem race condition (entre check e insert, outro request pode inserir). Camada A cobre.

**Camada A — DB UNIQUE INDEX parcial (❌ NÃO rodada ainda):**
SQL pronto pra colar no Supabase SQL Editor. Roda os 3 blocos em ordem:

```sql
-- 1. Limpar duplicatas existentes (zera doc das mais novas)
UPDATE public.clientes
SET documento = NULL
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY organization_id, documento
        ORDER BY created_at
      ) AS rn
    FROM public.clientes
    WHERE documento IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- 2. Criar índice único parcial (multi-tenant, permite múltiplos NULL)
CREATE UNIQUE INDEX IF NOT EXISTS clientes_org_documento_uniq
  ON public.clientes (organization_id, documento)
  WHERE documento IS NOT NULL;

-- 3. Verificar
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'clientes' AND indexname = 'clientes_org_documento_uniq';
```

**Por que `CREATE UNIQUE INDEX ... WHERE` em vez de `ALTER TABLE ADD CONSTRAINT UNIQUE`:** Postgres não suporta `WHERE` em constraints UNIQUE — só em índices. Funcionalmente é equivalente pro caso (gera o mesmo erro `23505`).

---

## 3. Próximos passos (ordem da próxima sessão)

1. **Rodar o SQL da Camada A** no Supabase (3 blocos acima, em ordem).
2. **Retestar o bug**: tentar criar 2 clientes com mesmo doc → erro inline. Tentar com doc vazio → permitido em múltiplos. Editar e salvar mantendo o mesmo doc → permitido.
3. **Commit dos testes** (se nenhum ajuste for necessário): elevar de `wip:` pra `fix(etapa-8):`.
4. **Pré-checagem da Parte 2 (Motoristas)**: confirmar que `SUPABASE_SERVICE_ROLE_KEY` foi adicionada em `.env.local` — sem isso, criar usuário em `auth.users` é impossível e a Parte 2 fica bloqueada de novo. Pegar em https://supabase.com/dashboard/project/rsaelamvnrhtvpkeyxvg/settings/api → seção *Project API keys* → valor `service_role`.
5. **Iniciar Parte 2 (CRUD Motoristas)** — plano detalhado já apresentado e aprovado em sessão anterior. Resumo:
   - Cria `src/lib/supabase/admin.ts` (cliente service-role; arquivo NOVO, não toca client.ts/server.ts)
   - 10 arquivos sob `src/app/(app)/motoristas/` (mesmo padrão de Containers/Clientes)
   - `createMotorista` chama `admin.auth.admin.createUser` + INSERT em profiles, com rollback se falhar
   - Listagem filtra `profiles WHERE role='motorista'`
   - Soft delete (`UPDATE profiles SET ativo=false`); NÃO apaga de `auth.users`
   - Defense-in-depth: action verifica que caller é `role='master'` antes de criar
6. **Etapa 9 ou debt**: opções pra próximas sessões: a) JOIN clientes(nome) na tabela de Containers (TODO da Etapa 7); b) etapas seguintes do produto (estoque, atrasados, manutenção, etc); c) atacar débito ESLint se for setar CI/pre-commit.

---

## 4. Débitos técnicos atuais (priorizados)

1. **Camada A do bug duplicado** (urgente, próxima sessão).
2. **`SUPABASE_SERVICE_ROLE_KEY` no `.env.local`** (bloqueia Parte 2). Já confirmado ausente nesta sessão.
3. **JOIN `clientes(nome)`** na coluna "Cliente Atual" da tabela de Containers (TODO comment em `containers/_components/containers-table.tsx`). Hoje mostra "Cliente vinculado" genérico ou "—".
4. **ESLint flat config** — resolvido com FlatCompat na Etapa 6/7. Sem débito ativo aqui (atualizando do meu registro anterior).

---

## 5. Bookmarks

- Profile real (master logado): `smartplanilha2@gmail.com` — `id: 8b686d17-79c6-4f5c-8b24-dcb14d93cfd7` — `organization_id: fbe548c7-909e-4d43-ae00-2250b1bd6374` — `role: master`
- Supabase project ref: `rsaelamvnrhtvpkeyxvg`
- Repositório: https://github.com/smartcontainer26/cacamba-smart
- `current_organization_id()` no Supabase: function `SECURITY DEFINER` (recriada na sessão da Etapa 5 pra resolver o bug de RLS recursion).

---

## 6. Status do working tree no fim da sessão

- Branch `main` em `9e166dc` (sincronizada com `origin/main`)
- Apenas `CONTINUIDADE.md` (este arquivo) será modificado depois deste commit — vai sair como `Changes not staged for commit` pra você decidir se commita como `docs: ...` ou deixa pra próxima sessão.
- Dev server **parado** (sem `node.exe` em execução).
