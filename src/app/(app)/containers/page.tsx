import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ContainersFilters } from "./_components/containers-filters";
import { ContainersTable } from "./_components/containers-table";
import type { ContainerComCliente } from "./_types";

const PAGE_SIZE = 20;

const SUCCESS_MESSAGES: Record<string, string> = {
  criado: "Container criado com sucesso.",
  atualizado: "Container atualizado.",
  deletado: "Container deletado.",
};

type SearchParams = Promise<{
  status?: string;
  q?: string;
  page?: string;
  msg?: string;
}>;

export default async function ContainersPage({
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
  // RLS já filtra por organization_id — não precisa filtro manual aqui.
  // Embedding cliente:clientes!cliente_atual_id(nome) traz o nome do
  // cliente vinculado quando há um (RLS de clientes também escopa por org).
  let query = supabase
    .from("containers")
    .select("*, cliente:clientes!cliente_atual_id(nome)", { count: "exact" });
  if (status !== "todos") query = query.eq("status", status);
  if (q) query = query.ilike("numero", `%${q}%`);

  const {
    data,
    count,
    error,
  } = await query
    .order("numero", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) throw error;

  const containers = (data ?? []) as unknown as ContainerComCliente[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = status !== "todos" || q !== "";

  return (
    <div className="px-8 py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Containers</h1>
          <p className="mt-1 text-sm text-text-muted">
            Gerencie a frota de caçambas da empresa.
          </p>
        </div>
        <Link
          href="/containers/novo"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="size-4" />
          Novo Container
        </Link>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          {successMsg}
        </div>
      )}

      <ContainersFilters />

      {total === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <>
          <ContainersTable containers={containers} />
          <Pagination
            page={page}
            totalPages={totalPages}
            offset={offset}
            shown={containers.length}
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
          ? "Nenhum container nessa busca."
          : "Nenhum container cadastrado."}
      </h2>
      <p className="mb-6 text-sm text-text-muted">
        {hasFilters
          ? "Tente outro filtro ou termo de busca."
          : "Cadastre o primeiro pra começar."}
      </p>
      {!hasFilters && (
        <Link
          href="/containers/novo"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="size-4" />
          Cadastrar primeiro container
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
    return qs ? `/containers?${qs}` : "/containers";
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
