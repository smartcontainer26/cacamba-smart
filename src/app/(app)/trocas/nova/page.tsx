import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TrocaForm } from "../_components/troca-form";
import { createTroca } from "../_actions/trocas";

export default async function NovaTrocaPage() {
  const supabase = await createClient();

  // Carrega listas (RLS escopa por org).
  // Containers: traz status='disponivel' (pra entregar) E status='em_uso'
  // (pra retirar). Filtragem cliente-side no form por modo + cliente.
  const [
    { data: clientes },
    { data: containers },
    { data: motoristas },
  ] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("containers")
      .select("id, numero, status, cliente_atual_id")
      .in("status", ["disponivel", "em_uso"])
      .order("numero"),
    supabase
      .from("profiles")
      .select("id, nome, email")
      .eq("role", "motorista")
      .eq("ativo", true)
      .order("nome"),
  ]);

  return (
    <div className="px-8 py-10">
      <div className="mb-6">
        <Link
          href="/trocas"
          className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ChevronLeft className="size-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-semibold">Nova Troca</h1>
        <p className="mt-1 text-sm text-text-muted">
          Registre uma operação de entrega, troca ou retirada de container.
        </p>
      </div>
      <TrocaForm
        action={createTroca}
        clientes={clientes ?? []}
        containers={containers ?? []}
        motoristas={motoristas ?? []}
      />
    </div>
  );
}
