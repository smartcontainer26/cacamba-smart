// Tipos compartilhados entre server actions, server components e client components.
// Fora de _actions/trocas.ts porque arquivos "use server" só podem
// exportar async functions (Next 15).

export const STATUSES = [
  "pendente",
  "aprovada",
  "rejeitada",
  "cancelada",
] as const;
export type TrocaStatus = (typeof STATUSES)[number];

export type Troca = {
  id: string;
  organization_id: string;
  motorista_id: string | null;
  cliente_id: string;
  container_retirado_id: string | null;
  container_entregue_id: string | null;
  observacoes: string | null;
  status: TrocaStatus;
  aprovada_por: string | null;
  aprovada_em: string | null;
  motivo_rejeicao: string | null;
  data_troca: string;
  created_at: string;
  updated_at: string;
};

// Versão com JOINs (PostgREST embedding) usada na lista e detalhes.
export type TrocaComRelacoes = Troca & {
  cliente: { nome: string } | null;
  container_retirado: { numero: string } | null;
  container_entregue: { numero: string } | null;
  motorista: { nome: string | null } | null;
};

export type FormState = { error: string | null };

// Tipos de operação no form (UX-only, NÃO vai pro DB).
// O DB armazena os 2 container ids; o tipo é derivado:
//   - retirado=null, entregue!=null → primeira_entrega
//   - retirado!=null, entregue!=null → troca
//   - retirado!=null, entregue=null → retirada_final
export const OPERACAO_TYPES = [
  "primeira_entrega",
  "troca",
  "retirada_final",
] as const;
export type OperacaoType = (typeof OPERACAO_TYPES)[number];
