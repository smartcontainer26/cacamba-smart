import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TrocasFilters } from "./_components/trocas-filters";
import { TrocasTable } from "./_components/trocas-table";
import { STATUSES, type TrocaComRelacoes } from "./_types";

const PAGE_SIZE = 20;

const SUCCESS_MESSAGES: Record<string, string> = {
  criada: "Troca cadastrada com sucesso.",
  cancelada: "Troca cancelada.",
};

const VALID_STATUSES: readonly string[] = STATUSES;

type SearchParams = Promise<{
  status?: string;
  q?: string;
  page?: string;
  msg?: string;
}>;

export default async function TrocasPage({
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

  // Busca por nome de cliente: PostgREST não filtra direto em campos de
  // relação aninhada. Resolve em 2 passos: 1) acha clientes por nome,
  // 2) filtra trocas por cliente_id IN (...). RLS escopa as duas queries.
  let clienteIdsForSearch: string[] | null = null;
  if (q) {
    const safe = q.replace(/[,()]/g, "");
    if (safe) {
      const { data: clientesMatching } = await supabase
        .from("clientes")
        .select("id")
        .ilike("nome", `%${safe}%`);
      clienteIdsForSearch = (clientesMatching ?? []).map((c) => c.id);
    }
  }

  let query = supabase
    .from("trocas")
    .select(
      `id, status, data_troca, observacoes, motivo_rejeicao,
       motorista_id, cliente_id, container_retirado_id, container_entregue_id,
       organization_id, aprovada_por, aprovada_em, created_at, updated_at,
       cliente:clientes!cliente_id(nome),
       container_retirado:containers!container_retirado_id(numero),
       container_entregue:containers!container_entregue_id(numero),
       motorista:profiles!motorista_id(nome)`,
      { count: "exact" },
    );

  if (status !== "todos" && VALID_STATUSES.includes(status)) {
    query = query.eq("status", status);
  }

  if (clienteIdsForSearch !== null) {
    if (clienteIdsForSearch.length === 0) {
      // Sem matches → força resultado vazio
      query = query.eq("cliente_id", "00000000-0000-0000-0000-000000000000");
    } else {
      query = query.in("cliente_id", clienteIdsForSearch);
    }
  }

  const { data, count, error } = await query
    .order("data_troca", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) throw error;

  const trocas = (data ?? []) as unknown as TrocaComRelacoes[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = status !== "todos" || q !== "";

  return (
    <div className="px-8 py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Trocas</h1>
          <p className="mt-1 text-sm text-text-muted">
            Histórico de entregas, trocas e retiradas de containers.
          </p>
        </div>
        <Link
          href="/trocas/nova"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="size-4" />
          Nova Troca
        </Link>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          {successMsg}
        </div>
      )}

      <TrocasFilters />

      {total === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <>
          <TrocasTable trocas={trocas} />
          <Pagination
            page={page}
            totalPages={totalPages}
            offset={offset}
            shown={trocas.length}
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
          ? "Nenhuma troca nessa busca."
          : "Nenhuma troca registrada ainda."}
      </h2>
      <p className="mb-6 text-sm text-text-muted">
        {hasFilters
          ? "Tente outro filtro ou termo de busca."
          : "Cadastre a primeira pra começar."}
      </p>
      {!hasFilters && (
        <Link
          href="/trocas/nova"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="size-4" />
          Cadastrar primeira troca
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
    return qs ? `/trocas?${qs}` : "/trocas";
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
