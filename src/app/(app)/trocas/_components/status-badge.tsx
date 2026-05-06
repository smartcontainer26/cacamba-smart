import type { TrocaStatus } from "../_types";

const STYLES: Record<TrocaStatus, string> = {
  pendente: "bg-yellow-500/15 text-yellow-300",
  aprovada: "bg-success/15 text-success",
  rejeitada: "bg-error/15 text-error",
  cancelada: "bg-text-muted/15 text-text-muted",
};

const LABELS: Record<TrocaStatus, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
  cancelada: "Cancelada",
};

export function StatusBadge({ status }: { status: TrocaStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
