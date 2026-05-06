import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ManutencoesFilters } from "./_components/manutencoes-filters";
import { ManutencoesTable } from "./_components/manutencoes-table";
import type { ManutencaoComRelacoes } from "./_types";

const PAGE_SIZE = 20;

const SUCCESS_MESSAGES: Record<string, string> = {
  criada: "Manutenção cadastrada com sucesso.",
  finalizada: "Manutenção finalizada.",
};

type SearchParams = Promise<{
  status?: string;
  q?: string;
  page?: string;
  msg?: string;
}>;

export default async function ManutencaoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status = params.status ?? "todos";
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const successMsg = params.msg ? SUCCESS_MESSAGES[params.msg] : null;

  const supabase = await createClient();

  // Busca por número de container: PostgREST não filtra direto em campos
  // de relação aninhada. 2 passos: 1) acha containers por numero, 2) filtra
  // manutenções por container_id IN (...). Mesmo padrão da busca por cliente
  // em Trocas.
  let containerIdsForSearch: string[] | null = null;
  if (q) {
    const safe = q.replace(/[,()]/g, "");
    if (safe) {
      const { data: containersMatching } = await supabase
        .from("containers")
        .select("id")
        .ilike("numero", `%${safe}%`);
      containerIdsForSearch = (containersMatching ?? []).map((c) => c.id);
    }
  }

  let query = supabase
    .from("manutencoes")
    .select(
      `id, organization_id, container_id, data_inicio, data_fim, descricao,
       created_at, updated_at,
       container:containers!container_id(numero)`,
      { count: "exact" },
    );

  if (status === "em_aberto") {
    query = query.is("data_fim", null);
  } else if (status === "concluida") {
    query = query.not("data_fim", "is", null);
  }

  if (containerIdsForSearch !== null) {
    if (containerIdsForSearch.length === 0) {
      // Sem matches → força resultado vazio
      query = query.eq(
        "container_id",
        "00000000-0000-0000-0000-000000000000",
      );
    } else {
      query = query.in("container_id", containerIdsForSearch);
    }
  }

  const { data, count, error } = await query
    .order("data_inicio", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) throw error;

  const manutencoes = (data ?? []) as unknown as ManutencaoComRelacoes[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = status !== "todos" || q !== "";

  return (
    <div className="px-8 py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Manutenção</h1>
          <p className="mt-1 text-sm text-text-muted">
            Histórico de manutenções (em aberto e concluídas).
          </p>
        </div>
        <Link
          href="/manutencao/nova"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="size-4" />
          Nova manutenção
        </Link>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          {successMsg}
        </div>
      )}

      <ManutencoesFilters />

      {total === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <>
          <ManutencoesTable manutencoes={manutencoes} />
          <Pagination
            page={page}
            totalPages={totalPages}
            offset={offset}
            shown={manutencoes.length}
            total={total}
            params={{ status, q }}
          />
        </>
      )}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface px-6 py-16 text-center">
      <h2 className="mb-2 text-lg font-medium">
        {hasFilters
          ? "Nenhuma manutenção nessa busca."
          : "Nenhuma manutenção registrada ainda."}
      </h2>
      <p className="mb-6 text-sm text-text-muted">
        {hasFilters
          ? "Tente outro filtro ou termo de busca."
          : "Cadastre a primeira pra começar."}
      </p>
      {!hasFilters && (
        <Link
          href="/manutencao/nova"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="size-4" />
          Cadastrar primeira manutenção
        </Link>
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  offset,
  shown,
  total,
  params,
}: {
  page: number;
  totalPages: number;
  offset: number;
  shown: number;
  total: number;
  params: { status: string; q: string };
}) {
  const buildHref = (p: number) => {
    const sp = new URLSearchParams();
    if (params.status !== "todos") sp.set("status", params.status);
    if (params.q) sp.set("q", params.q);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/manutencao?${qs}` : "/manutencao";
  };

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-text-muted">
      <p>
        Mostrando {offset + 1}–{offset + shown} de {total}
      </p>
      <div className="flex gap-2">
        <PaginationLink href={buildHref(page - 1)} disabled={page <= 1}>
          Anterior
        </PaginationLink>
        <PaginationLink
          href={buildHref(page + 1)}
          disabled={page >= totalPages}
        >
          Próxima
        </PaginationLink>
      </div>
    </div>
  );
}

function PaginationLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-md border border-border px-3 py-1.5 text-text-muted/50">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-md border border-border px-3 py-1.5 transition-colors hover:bg-surface-elevated hover:text-text"
    >
      {children}
    </Link>
  );
}
