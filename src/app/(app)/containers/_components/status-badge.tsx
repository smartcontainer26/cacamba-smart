import type { ContainerStatus } from "../_types";

const STYLES: Record<ContainerStatus, string> = {
  disponivel: "bg-success/15 text-success",
  em_uso: "bg-blue-500/15 text-blue-300",
  manutencao: "bg-yellow-500/15 text-yellow-300",
  inativo: "bg-text-muted/15 text-text-muted",
};

const LABELS: Record<ContainerStatus, string> = {
  disponivel: "Disponível",
  em_uso: "Em uso",
  manutencao: "Manutenção",
  inativo: "Inativo",
};

export function StatusBadge({ status }: { status: ContainerStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
