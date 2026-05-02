import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MotoristasFilters } from "./_components/motoristas-filters";
import { MotoristasTable } from "./_components/motoristas-table";
import type { Motorista } from "./_types";

const PAGE_SIZE = 20;

const SUCCESS_MESSAGES: Record<string, string> = {
  criado: "Motorista cadastrado com sucesso.",
  atualizado: "Motorista atualizado.",
  desativado: "Motorista desativado.",
};

type SearchParams = Promise<{
  status?: string;
  q?: string;
  page?: string;
  msg?: string;
}>;

export default async function MotoristasPage({
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
  // RLS já filtra por organization_id. Adiciona filtro por role.
  let query = supabase
    .from("profiles")
    .select(
      "id, organization_id, nome, email, telefone, role, ativo, created_at, updated_at",
      { count: "exact" },
    )
    .eq("role", "motorista");

  if (status === "ativos") query = query.eq("ativo", true);
  else if (status === "inativos") query = query.eq("ativo", false);

  if (q) {
    const safe = q.replace(/[,()]/g, "");
    if (safe) {
      query = query.or(`nome.ilike.%${safe}%,email.ilike.%${safe}%`);
    }
  }

  const { data, count, error } = await query
    .order("nome", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) throw error;

  const motoristas = (data ?? []) as Motorista[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = status !== "todos" || q !== "";

  return (
    <div className="px-8 py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Motoristas</h1>
          <p className="mt-1 text-sm text-text-muted">
            Cadastre e gerencie os motoristas que usam o app.
          </p>
        </div>
        <Link
          href="/motoristas/novo"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="size-4" />
          Novo Motorista
        </Link>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          {successMsg}
        </div>
      )}

      <MotoristasFilters />

      {total === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <>
          <MotoristasTable motoristas={motoristas} />
          <Pagination
            page={page}
            totalPages={totalPages}
            offset={offset}
            shown={motoristas.length}
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
          ? "Nenhum motorista nessa busca."
          : "Nenhum motorista cadastrado."}
      </h2>
      <p className="mb-6 text-sm text-text-muted">
        {hasFilters
          ? "Tente outro filtro ou termo de busca."
          : "Cadastre o primeiro pra começar."}
      </p>
      {!hasFilters && (
        <Link
          href="/motoristas/novo"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="size-4" />
          Cadastrar primeiro motorista
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
    return qs ? `/motoristas?${qs}` : "/motoristas";
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
