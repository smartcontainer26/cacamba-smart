import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { deriveStatus, type ManutencaoComRelacoes } from "../_types";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function truncate(s: string | null, max: number): string {
  if (!s) return "—";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export function ManutencoesTable({
  manutencoes,
}: {
  manutencoes: ManutencaoComRelacoes[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-elevated text-text-muted">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Container</th>
            <th className="px-4 py-3 text-left font-medium">Início</th>
            <th className="px-4 py-3 text-left font-medium">Fim</th>
            <th className="px-4 py-3 text-left font-medium">Descrição</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Detalhes</th>
          </tr>
        </thead>
        <tbody>
          {manutencoes.map((m) => (
            <tr
              key={m.id}
              className="border-t border-border bg-surface transition-colors hover:bg-surface-elevated"
            >
              <td className="px-4 py-3 font-medium">
                {m.container?.numero ? `#${m.container.numero}` : "—"}
              </td>
              <td className="px-4 py-3 text-text-muted">
                {formatDate(m.data_inicio)}
              </td>
              <td className="px-4 py-3 text-text-muted">
                {formatDate(m.data_fim)}
              </td>
              <td className="px-4 py-3 text-text-muted">
                {truncate(m.descricao, 60)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={deriveStatus(m)} />
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/manutencao/${m.id}`}
                  aria-label={`Ver detalhes da manutenção iniciada em ${formatDate(m.data_inicio)}`}
                  className="inline-flex rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-accent"
                >
                  <ChevronRight className="size-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
