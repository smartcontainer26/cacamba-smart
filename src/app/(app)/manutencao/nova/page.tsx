import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NewManutencaoForm } from "../_components/new-manutencao-form";
import { createManutencao } from "../_actions/manutencoes";

// datetime-local input precisa do formato YYYY-MM-DDTHH:mm (sem TZ).
function nowForDatetimeLocal(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function NovaManutencaoPage() {
  const supabase = await createClient();

  const { data: containers } = await supabase
    .from("containers")
    .select("id, numero")
    .eq("status", "disponivel")
    .order("numero");

  return (
    <div className="px-8 py-10">
      <div className="mb-6">
        <Link
          href="/manutencao"
          className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ChevronLeft className="size-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-semibold">Nova Manutenção</h1>
        <p className="mt-1 text-sm text-text-muted">
          Marca um container como em manutenção e registra o início.
        </p>
      </div>
      <NewManutencaoForm
        action={createManutencao}
        containers={containers ?? []}
        defaultDataInicio={nowForDatetimeLocal()}
      />
    </div>
  );
}
