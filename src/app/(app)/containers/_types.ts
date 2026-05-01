// Tipos e constantes compartilhados entre server actions, server components
// e client components. Fora de _actions/containers.ts porque arquivos
// "use server" só podem exportar async functions (Next 15).

export const STATUSES = [
  "disponivel",
  "em_uso",
  "manutencao",
  "inativo",
] as const;

export type ContainerStatus = (typeof STATUSES)[number];

export type Container = {
  id: string;
  organization_id: string;
  numero: string;
  tipo: string | null;
  status: ContainerStatus;
  cliente_atual_id: string | null;
  data_entrega: string | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type FormState = { error: string | null };
