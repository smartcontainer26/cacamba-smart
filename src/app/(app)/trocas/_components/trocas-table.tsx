import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "./status-badge";
import type { TrocaComRelacoes } from "../_types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function TrocasTable({ trocas }: { trocas: TrocaComRelacoes[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-elevated text-text-muted">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Data</th>
            <th className="px-4 py-3 text-left font-medium">Cliente</th>
            <th className="px-4 py-3 text-left font-medium">Retirado</th>
            <th className="px-4 py-3 text-left font-medium">Entregue</th>
            <th className="px-4 py-3 text-left font-medium">Motorista</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Detalhes</th>
          </tr>
        </thead>
        <tbody>
          {trocas.map((t) => (
            <tr
              key={t.id}
              className="border-t border-border bg-surface transition-colors hover:bg-surface-elevated"
            >
              <td className="px-4 py-3 text-text-muted">
                {formatDate(t.data_troca)}
              </td>
              <td className="px-4 py-3 font-medium">
                {t.cliente?.nome ?? "—"}
              </td>
              <td className="px-4 py-3 text-text-muted">
                {t.container_retirado?.numero
                  ? `#${t.container_retirado.numero}`
                  : "—"}
              </td>
              <td className="px-4 py-3 text-text-muted">
                {t.container_entregue?.numero
                  ? `#${t.container_entregue.numero}`
                  : "—"}
              </td>
              <td className="px-4 py-3 text-text-muted">
                {t.motorista?.nome?.trim() || "—"}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={t.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/trocas/${t.id}`}
                  aria-label={`Ver detalhes da troca de ${formatDate(t.data_troca)}`}
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
