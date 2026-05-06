import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ContainerAtrasado } from "../_types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function diasEmUso(iso: string): number {
  const t = new Date(iso).getTime();
  if (isNaN(t)) return 0;
  return Math.floor((Date.now() - t) / 86400000);
}

export function AtrasadosTable({
  containers,
}: {
  containers: ContainerAtrasado[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-elevated text-text-muted">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Container</th>
            <th className="px-4 py-3 text-left font-medium">Cliente</th>
            <th className="px-4 py-3 text-left font-medium">Data Entrega</th>
            <th className="px-4 py-3 text-left font-medium">Dias em uso</th>
            <th className="px-4 py-3 text-right font-medium">Detalhes</th>
          </tr>
        </thead>
        <tbody>
          {containers.map((c) => (
            <tr
              key={c.id}
              className="border-t border-border bg-surface transition-colors hover:bg-surface-elevated"
            >
              <td className="px-4 py-3 font-medium">#{c.numero}</td>
              <td className="px-4 py-3 text-text-muted">
                {c.cliente?.nome ?? "—"}
              </td>
              <td className="px-4 py-3 text-text-muted">
                {formatDate(c.data_entrega)}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-xs font-medium text-yellow-300">
                  {diasEmUso(c.data_entrega)} dias
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/containers/${c.id}`}
                  aria-label={`Ver detalhes do container ${c.numero}`}
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
