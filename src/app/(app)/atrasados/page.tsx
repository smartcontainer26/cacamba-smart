import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AtrasadosTable } from "./_components/atrasados-table";
import { DIAS_LIMITE } from "./_lib/constants";
import type { ContainerAtrasado } from "./_types";

const PAGE_SIZE = 20;

type SearchParams = Promise<{
  q?: string;
  page?: string;
}>;

export default async function AtrasadosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  // Busca por nome de cliente em 2 passos (PostgREST não filtra direto
  // em campos de relação aninhada). Mesmo padrão da busca em Trocas.
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

  // Limite: containers em uso há MAIS de DIAS_LIMITE dias.
  // Containers com data_entrega NULL são intencionalmente excluídos
  // (sem data de referência → não dá pra calcular atraso).
  const limiteISO = new Date(
    Date.now() - DIAS_LIMITE * 86400000,
  ).toISOString();

  let query = supabase
    .from("containers")
    .select(
      "id, numero, data_entrega, cliente:clientes!cliente_atual_id(nome)",
      { count: "exact" },
    )
    .eq("status", "em_uso")
    .not("data_entrega", "is", null)
    .lt("data_entrega", limiteISO);

  if (clienteIdsForSearch !== null) {
    if (clienteIdsForSearch.length === 0) {
      // Sem matches → força resultado vazio
      query = query.eq(
        "cliente_atual_id",
        "00000000-0000-0000-0000-000000000000",
      );
    } else {
      query = query.in("cliente_atual_id", clienteIdsForSearch);
    }
  }

  const { data, count, error } = await query
    .order("data_entrega", { ascending: true }) // mais antigo primeiro = mais urgente
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) throw error;

  const containers = (data ?? []) as unknown as ContainerAtrasado[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = q !== "";

  return (
    <div className="px-8 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Atrasados</h1>
        <p className="mt-1 text-sm text-text-muted">
          Containers em uso há mais de {DIAS_LIMITE} dias.
        </p>
      </div>

      {total === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <>
          <AtrasadosTable containers={containers} />
          <Pagination
            page={page}
            totalPages={totalPages}
            offset={offset}
            shown={containers.length}
            total={total}
            params={{ q }}
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
          ? "Nenhum atrasado nessa busca."
          : "Nenhum container atrasado."}
      </h2>
      <p className="text-sm text-text-muted">
        {hasFilters ? "Tente outro termo." : "Tudo dentro do prazo."}
      </p>
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
  params: { q: string };
}) {
  const buildHref = (p: number) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/atrasados?${qs}` : "/atrasados";
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
        <PaginationLink href={buildHref(page + 1)} disabled={page >= totalPages}>
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
