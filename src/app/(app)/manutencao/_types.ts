// Tipos compartilhados entre server actions, server components e client components.
// Fora de _actions/manutencoes.ts porque arquivos "use server" só podem
// exportar async functions (Next 15).

export const STATUSES = ["em_aberto", "concluida"] as const;
export type ManutencaoStatus = (typeof STATUSES)[number];

export type Manutencao = {
  id: string;
  organization_id: string;
  container_id: string;
  data_inicio: string;
  data_fim: string | null;
  descricao: string | null;
  created_at: string;
  updated_at: string;
};

// Versão com JOIN (PostgREST embedding) — usada na lista e detalhes.
export type ManutencaoComRelacoes = Manutencao & {
  container: { numero: string } | null;
};

export type FormState = { error: string | null };

// Status NÃO persiste no DB — é sempre derivado de data_fim.
//   data_fim === null  → em_aberto
//   data_fim !== null  → concluida
export function deriveStatus(
  m: Pick<Manutencao, "data_fim">,
): ManutencaoStatus {
  return m.data_fim === null ? "em_aberto" : "concluida";
}
