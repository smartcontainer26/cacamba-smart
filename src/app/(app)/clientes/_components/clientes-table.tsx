import Link from "next/link";
import { Pencil } from "lucide-react";
import type { Cliente } from "../_types";

function formatLocation(cidade: string | null, estado: string | null): string {
  if (!cidade && !estado) return "—";
  if (!estado) return cidade ?? "—";
  if (!cidade) return estado;
  return `${cidade}/${estado}`;
}

export function ClientesTable({ clientes }: { clientes: Cliente[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-elevated text-text-muted">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Nome</th>
            <th className="px-4 py-3 text-left font-medium">Documento</th>
            <th className="px-4 py-3 text-left font-medium">Telefone</th>
            <th className="px-4 py-3 text-left font-medium">Cidade/UF</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr
              key={c.id}
              className="border-t border-border bg-surface transition-colors hover:bg-surface-elevated"
            >
              <td className="px-4 py-3 font-medium">{c.nome}</td>
              <td className="px-4 py-3 text-text-muted">{c.documento ?? "—"}</td>
              <td className="px-4 py-3 text-text-muted">{c.telefone ?? "—"}</td>
              <td className="px-4 py-3 text-text-muted">
                {formatLocation(c.cidade, c.estado)}
              </td>
              <td className="px-4 py-3">
                {c.ativo ? (
                  <span className="inline-flex items-center rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
                    Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-text-muted/15 px-2.5 py-0.5 text-xs font-medium text-text-muted">
                    Inativo
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/clientes/${c.id}`}
                  aria-label={`Editar cliente ${c.nome}`}
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
