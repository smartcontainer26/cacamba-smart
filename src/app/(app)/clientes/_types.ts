// Tipos compartilhados entre server actions, server components e client components.
// Fora de _actions/clientes.ts porque arquivos "use server" só podem
// exportar async functions (Next 15).

export type Cliente = {
  id: string;
  organization_id: string;
  nome: string;
  documento: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type FormState = { error: string | null };
