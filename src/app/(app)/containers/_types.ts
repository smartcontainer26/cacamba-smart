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

// Versão com JOIN (PostgREST embedding) — usada na listagem pra mostrar
// o nome do cliente vinculado em vez do UUID. Não substitui o Container
// original porque outros lugares (ex: form de edição) operam só com as
// colunas da tabela e não precisam do embed.
export type ContainerComCliente = Container & {
  cliente: { nome: string } | null;
};

export type FormState = { error: string | null };
