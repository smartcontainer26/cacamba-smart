"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "../_types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseFormData(fd: FormData) {
  return {
    nome: String(fd.get("nome") ?? "").trim(),
    documento: String(fd.get("documento") ?? "").trim() || null,
    telefone: String(fd.get("telefone") ?? "").trim() || null,
    email: String(fd.get("email") ?? "").trim() || null,
    endereco: String(fd.get("endereco") ?? "").trim() || null,
    cidade: String(fd.get("cidade") ?? "").trim() || null,
    estado: String(fd.get("estado") ?? "").trim().toUpperCase() || null,
    observacoes: String(fd.get("observacoes") ?? "").trim() || null,
    ativo: fd.get("ativo") === "on",
  };
}

function validate(d: ReturnType<typeof parseFormData>): string | null {
  if (!d.nome) return "Nome é obrigatório.";
  if (d.email && !EMAIL_REGEX.test(d.email)) return "Email inválido.";
  if (d.estado && d.estado.length !== 2) {
    return "UF deve ter 2 letras.";
  }
  return null;
}

export async function createCliente(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const data = parseFormData(fd);
  const err = validate(data);
  if (err) return { error: err };

  const supabase = await createClient();

  const { data: orgId, error: orgErr } = await supabase.rpc(
    "current_organization_id",
  );
  if (orgErr || !orgId) {
    return { error: "Sessão inválida. Faça login novamente." };
  }

  // Camada B: check app-level de duplicidade de documento (best-effort).
  // RLS já escopa por organization_id — não preciso filtrar manualmente.
  // Documento null/vazio é permitido pra múltiplos clientes.
  // Camada A (UNIQUE INDEX parcial no DB) cobre race conditions.
  if (data.documento) {
    const { data: existing } = await supabase
      .from("clientes")
      .select("id")
      .eq("documento", data.documento)
      .limit(1);
    if (existing && existing.length > 0) {
      return { error: "Já existe um cliente com esse documento." };
    }
  }

  const { error } = await supabase.from("clientes").insert({
    organization_id: orgId,
    ...data,
  });

  if (error?.code === "23505") {
    return { error: "Já existe um cliente com esse documento." };
  }
  if (error) {
    return { error: "Erro ao salvar cliente. Tente novamente." };
  }

  revalidatePath("/clientes");
  redirect("/clientes?msg=criado");
}

export async function updateCliente(
  id: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const data = parseFormData(fd);
  const err = validate(data);
  if (err) return { error: err };

  const supabase = await createClient();

  // Camada B: check app-level de duplicidade. .neq("id", id) exclui o
  // próprio registro (senão você não conseguiria salvar uma edição
  // que mantém o mesmo documento).
  if (data.documento) {
    const { data: existing } = await supabase
      .from("clientes")
      .select("id")
      .eq("documento", data.documento)
      .neq("id", id)
      .limit(1);
    if (existing && existing.length > 0) {
      return { error: "Já existe um cliente com esse documento." };
    }
  }

  const { error } = await supabase.from("clientes").update(data).eq("id", id);

  if (error?.code === "23505") {
    return { error: "Já existe um cliente com esse documento." };
  }
  if (error) {
    return { error: "Erro ao atualizar cliente. Tente novamente." };
  }

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  redirect("/clientes?msg=atualizado");
}

export async function deleteCliente(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("clientes").delete().eq("id", id);

  if (error?.code === "23503") {
    return {
      error:
        "Cliente está vinculado a outros registros e não pode ser deletado.",
    };
  }
  if (error) {
    return { error: "Erro ao deletar cliente." };
  }

  revalidatePath("/clientes");
  redirect("/clientes?msg=deletado");
}
