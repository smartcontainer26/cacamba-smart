import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContainerForm } from "../_components/container-form";
import { updateContainer } from "../_actions/containers";
import type { Container } from "../_types";

export default async function EditContainerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("containers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) notFound();

  const container = data as Container;
  const updateAction = updateContainer.bind(null, id);

  return (
    <div className="px-8 py-10">
      <div className="mb-6">
        <Link
          href="/containers"
          className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ChevronLeft className="size-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-semibold">Editar Container</h1>
        <p className="mt-1 text-sm text-text-muted">#{container.numero}</p>
      </div>
      <ContainerForm
        mode="edit"
        action={updateAction}
        container={container}
      />
    </div>
  );
}
