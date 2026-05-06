import Link from "next/link";
import { Pencil } from "lucide-react";
import { StatusBadge } from "./status-badge";
import type { ContainerComCliente } from "../_types";

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

export function ContainersTable({
  containers,
}: {
  containers: ContainerComCliente[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-elevated text-text-muted">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Número</th>
            <th className="px-4 py-3 text-left font-medium">Tipo</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Cliente</th>
            <th className="px-4 py-3 text-left font-medium">Data Entrega</th>
            <th className="px-4 py-3 text-right font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {containers.map((c) => (
            <tr
              key={c.id}
              className="border-t border-border bg-surface transition-colors hover:bg-surface-elevated"
            >
              <td className="px-4 py-3 font-medium">{c.numero}</td>
              <td className="px-4 py-3 text-text-muted">{c.tipo ?? "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge status={c.status} />
              </td>
              <td className="px-4 py-3 text-text-muted">
                {c.cliente?.nome ?? "—"}
              </td>
              <td className="px-4 py-3 text-text-muted">
                {formatDate(c.data_entrega)}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/containers/${c.id}`}
                  aria-label={`Editar container ${c.numero}`}
                  className="inline-flex rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface hover:text-accent"
                >
                  <Pencil className="size-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
