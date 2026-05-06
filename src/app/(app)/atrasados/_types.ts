// Tipo único pra linha da listagem. Não há form (tela read-only) nem
// FormState. data_entrega é declarada não-nullable porque a query
// filtra `.not("data_entrega", "is", null)`.

export type ContainerAtrasado = {
  id: string;
  numero: string;
  data_entrega: string;
  cliente: { nome: string } | null;
};
