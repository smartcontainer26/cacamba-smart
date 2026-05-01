import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClienteForm } from "../_components/cliente-form";
import { updateCliente } from "../_actions/clientes";
import type { Cliente } from "../_types";

export default async function EditClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) notFound();

  const cliente = data as Cliente;
  const updateAction = updateCliente.bind(null, id);

  return (
    <div className="px-8 py-10">
      <div className="mb-6">
        <Link
          href="/clientes"
          className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ChevronLeft className="size-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-semibold">Editar Cliente</h1>
        <p className="mt-1 text-sm text-text-muted">{cliente.nome}</p>
      </div>
      <ClienteForm mode="edit" action={updateAction} cliente={cliente} />
    </div>
  );
}
