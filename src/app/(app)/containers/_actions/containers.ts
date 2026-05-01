"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  STATUSES,
  type ContainerStatus,
  type FormState,
} from "../_types";

const isValidStatus = (s: string): s is ContainerStatus =>
  (STATUSES as readonly string[]).includes(s);

function parseFormData(fd: FormData) {
  const numero = String(fd.get("numero") ?? "").trim();
  const tipoRaw = String(fd.get("tipo") ?? "").trim();
  const statusRaw = String(fd.get("status") ?? "disponivel");
  const obsRaw = String(fd.get("observacoes") ?? "").trim();
  return {
    numero,
    tipo: tipoRaw || null,
    statusRaw,
    observacoes: obsRaw || null,
  };
}

export async function createContainer(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const { numero, tipo, statusRaw, observacoes } = parseFormData(fd);

  if (!numero) return { error: "Número é obrigatório." };
  if (!isValidStatus(statusRaw)) return { error: "Status inválido." };

  const supabase = await createClient();

  const { data: orgId, error: orgErr } = await supabase.rpc(
    "current_organization_id",
  );
  if (orgErr || !orgId) {
    return { error: "Sessão inválida. Faça login novamente." };
  }

  const { error } = await supabase.from("containers").insert({
    organization_id: orgId,
    numero,
    tipo,
    status: statusRaw,
    observacoes,
    ativo: true,
  });

  if (error?.code === "23505") {
    return { error: "Já existe um container com esse número." };
  }
  if (error) {
    return { error: "Erro ao salvar container. Tente novamente." };
  }

  revalidatePath("/containers");
  redirect("/containers?msg=criado");
}

export async function updateContainer(
  id: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const { numero, tipo, statusRaw, observacoes } = parseFormData(fd);

  if (!numero) return { error: "Número é obrigatório." };
  if (!isValidStatus(statusRaw)) return { error: "Status inválido." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("containers")
    .update({
      numero,
      tipo,
      status: statusRaw,
      observacoes,
    })
    .eq("id", id);

  if (error?.code === "23505") {
    return { error: "Já existe um container com esse número." };
  }
  if (error) {
    return { error: "Erro ao atualizar container. Tente novamente." };
  }

  revalidatePath("/containers");
  revalidatePath(`/containers/${id}`);
  redirect("/containers?msg=atualizado");
}

export async function deleteContainer(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("containers").delete().eq("id", id);

  if (error?.code === "23503") {
    return {
      error:
        "Container está vinculado a outros registros e não pode ser deletado.",
    };
  }
  if (error) {
    return { error: "Erro ao deletar container." };
  }

  revalidatePath("/containers");
  redirect("/containers?msg=deletado");
}
