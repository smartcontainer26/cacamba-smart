import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "../_components/status-badge";
import { CancelButton } from "../_components/cancel-button";
import { ObservacoesEditor } from "../_components/observacoes-editor";
import { atualizarObservacoes } from "../_actions/trocas";
import type { TrocaComRelacoes } from "../_types";

const SUCCESS_MESSAGES: Record<string, string> = {
  observacoes_atualizadas: "Observações atualizadas.",
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

export default async function TrocaDetalhesPage({
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
    .from("trocas")
    .select(
      `id, status, data_troca, observacoes, motivo_rejeicao,
       motorista_id, cliente_id, container_retirado_id, container_entregue_id,
       organization_id, aprovada_por, aprovada_em, created_at, updated_at,
       cliente:clientes!cliente_id(nome),
       container_retirado:containers!container_retirado_id(numero),
       container_entregue:containers!container_entregue_id(numero),
       motorista:profiles!motorista_id(nome),
       aprovador:profiles!aprovada_por(nome)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) notFound();

  const troca = data as unknown as TrocaComRelacoes & {
    aprovador: { nome: string | null } | null;
  };
  const updateObs = atualizarObservacoes.bind(null, id);

  return (
    <div className="px-8 py-10">
      <div className="mb-6">
        <Link
          href="/trocas"
          className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ChevronLeft className="size-4" />
          Voltar
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-2xl font-semibold">Troca</h1>
            <div className="flex items-center gap-3 text-sm text-text-muted">
              <StatusBadge status={troca.status} />
              <span>{formatDateTime(troca.data_troca)}</span>
            </div>
          </div>
          {troca.status === "aprovada" && <CancelButton id={troca.id} />}
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          {successMsg}
        </div>
      )}

      <div className="max-w-3xl space-y-6">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <dl className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <DetailItem label="Cliente" value={troca.cliente?.nome ?? "—"} />
            <DetailItem
              label="Motorista"
              value={troca.motorista?.nome?.trim() || "—"}
            />
            <DetailItem
              label="Container retirado"
              value={
                troca.container_retirado?.numero
                  ? `#${troca.container_retirado.numero}`
                  : "—"
              }
            />
            <DetailItem
              label="Container entregue"
              value={
                troca.container_entregue?.numero
                  ? `#${troca.container_entregue.numero}`
                  : "—"
              }
            />
            <DetailItem
              label="Aprovada por"
              value={troca.aprovador?.nome?.trim() || "—"}
            />
            <DetailItem
              label="Aprovada em"
              value={formatDateTime(troca.aprovada_em)}
            />
            {troca.status === "rejeitada" && (
              <div className="md:col-span-2">
                <DetailItem
                  label="Motivo da rejeição"
                  value={troca.motivo_rejeicao ?? "—"}
                />
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-3 text-sm font-medium text-text-muted">
            Observações
          </h2>
          <ObservacoesEditor
            initialValue={troca.observacoes}
            action={updateObs}
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
