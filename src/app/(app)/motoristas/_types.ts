// Tipos compartilhados entre server actions, server components e client components.
// Fora de _actions/motoristas.ts porque arquivos "use server" só podem
// exportar async functions (Next 15).

export type Motorista = {
  id: string;
  organization_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type FormState = { error: string | null };
