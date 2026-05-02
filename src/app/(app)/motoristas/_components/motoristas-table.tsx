import Link from "next/link";
import { Pencil } from "lucide-react";
import type { Motorista } from "../_types";

export function MotoristasTable({
  motoristas,
}: {
  motoristas: Motorista[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-elevated text-text-muted">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Nome</th>
            <th className="px-4 py-3 text-left font-medium">Email</th>
            <th className="px-4 py-3 text-left font-medium">Telefone</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {motoristas.map((m) => (
            <tr
              key={m.id}
              className="border-t border-border bg-surface transition-colors hover:bg-surface-elevated"
            >
              <td className="px-4 py-3 font-medium">{m.nome}</td>
              <td className="px-4 py-3 text-text-muted">{m.email}</td>
              <td className="px-4 py-3 text-text-muted">
                {m.telefone ?? "—"}
              </td>
              <td className="px-4 py-3">
                {m.ativo ? (
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
                  href={`/motoristas/${m.id}`}
                  aria-label={`Editar motorista ${m.nome}`}
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
