import type { ManutencaoStatus } from "../_types";

const STYLES: Record<ManutencaoStatus, string> = {
  // "Em aberto" = warning. Theme do projeto não tem token `warning`,
  // mantendo o padrão de Trocas/Containers que usa yellow-500 default.
  em_aberto: "bg-yellow-500/15 text-yellow-300",
  // "Concluída" = neutro discreto.
  concluida: "bg-surface-elevated text-text-muted",
};

const LABELS: Record<ManutencaoStatus, string> = {
  em_aberto: "Em aberto",
  concluida: "Concluída",
};

export function StatusBadge({ status }: { status: ManutencaoStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
