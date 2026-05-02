import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MotoristaForm } from "../_components/motorista-form";
import { updateMotorista } from "../_actions/motoristas";
import type { Motorista } from "../_types";

export default async function EditMotoristaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  // .eq("role", "motorista") garante que /motoristas/[id] não vira
  // backdoor pra editar profiles que não são motoristas.
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, organization_id, nome, email, telefone, role, ativo, created_at, updated_at",
    )
    .eq("id", id)
    .eq("role", "motorista")
    .maybeSingle();

  if (error) throw error;
  if (!data) notFound();

  const motorista = data as Motorista;
  const updateAction = updateMotorista.bind(null, id);

  return (
    <div className="px-8 py-10">
      <div className="mb-6">
        <Link
          href="/motoristas"
          className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ChevronLeft className="size-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-semibold">Editar Motorista</h1>
        <p className="mt-1 text-sm text-text-muted">{motorista.nome}</p>
      </div>
      <MotoristaForm mode="edit" action={updateAction} motorista={motorista} />
    </div>
  );
}
