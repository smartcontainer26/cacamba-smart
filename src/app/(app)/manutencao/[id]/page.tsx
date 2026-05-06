import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "../_components/status-badge";
import { FinalizarButton } from "../_components/finalizar-button";
import { atualizarDescricao } from "../_actions/manutencoes";
import { deriveStatus, type ManutencaoComRelacoes } from "../_types";
import { DescricaoForm } from "./_descricao-form";

const SUCCESS_MESSAGES: Record<string, string> = {
  descricao_atualizada: "Descrição atualizada.",
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type SearchParams = Promise<{ msg?: string }>;

export default async function ManutencaoDetalhesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const successMsg = sp.msg ? SUCCESS_MESSAGES[sp.msg] : null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("manutencoes")
    .select(
      `id, organization_id, container_id, data_inicio, data_fim, descricao,
       created_at, updated_at,
       container:containers!container_id(numero)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) notFound();

  const manutencao = data as unknown as ManutencaoComRelacoes;
  const status = deriveStatus(manutencao);
  const updateAction = atualizarDescricao.bind(null, id);

  return (
    <div className="px-8 py-10">
      <div className="mb-6">
        <Link
          href="/manutencao"
          className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ChevronLeft className="size-4" />
          Voltar
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-2xl font-semibold">Manutenção</h1>
            <div className="flex items-center gap-3 text-sm text-text-muted">
              <StatusBadge status={status} />
              <span>{formatDateTime(manutencao.data_inicio)}</span>
            </div>
          </div>
          {status === "em_aberto" && <FinalizarButton id={manutencao.id} />}
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          {successMsg}
        </div>
      )}

      <div className="max-w-3xl space-y-6">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <DetailItem
              label="Container"
              value={
                manutencao.container?.numero
                  ? `#${manutencao.container.numero}`
                  : "—"
              }
            />
            <DetailItem
              label="Status"
              value={status === "em_aberto" ? "Em aberto" : "Concluída"}
            />
            <DetailItem
              label="Início"
              value={formatDateTime(manutencao.data_inicio)}
            />
            <DetailItem
              label="Fim"
              value={formatDateTime(manutencao.data_fim)}
            />
          </dl>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-3 text-sm font-medium text-text-muted">
            Descrição
          </h2>
          <DescricaoForm
            initialValue={manutencao.descricao}
            action={updateAction}
          />
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-text-muted">
        {label}
      </dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}
