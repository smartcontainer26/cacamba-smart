"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMaster } from "../../_lib/require-master";
import type { FormState } from "../_types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createMotorista(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const nome = String(fd.get("nome") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const telefone = String(fd.get("telefone") ?? "").trim() || null;
  const ativo = fd.get("ativo") === "on";

  if (!nome) return { error: "Nome é obrigatório." };
  if (!email) return { error: "Email é obrigatório." };
  if (!EMAIL_REGEX.test(email)) return { error: "Email inválido." };
  if (!password || password.length < 6) {
    return { error: "Senha precisa ter no mínimo 6 caracteres." };
  }

  // Defense-in-depth: o layout já gateou, mas validar de novo.
  // requireMaster também devolve a orgId pra usar no INSERT
  // (NÃO confiar em form input — admin client bypassa RLS).
  const auth = await requireMaster();
  if (!auth.ok) {
    return { error: "Apenas usuários master podem cadastrar motoristas." };
  }

  const admin = createAdminClient();

  // 1. Cria auth user
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authErr) {
    if (authErr.message.toLowerCase().includes("already")) {
      return { error: "Email já cadastrado." };
    }
    return { error: "Erro ao criar usuário." };
  }
  if (!created?.user) {
    return { error: "Erro ao criar usuário." };
  }

  // 2. INSERT em profiles. Se falhar → ROLLBACK do auth user.
  const { error: profErr } = await admin.from("profiles").insert({
    id: created.user.id,
    organization_id: auth.orgId,
    nome,
    email,
    telefone,
    role: "motorista",
    ativo,
  });

  if (profErr) {
    const { error: rollbackErr } = await admin.auth.admin.deleteUser(
      created.user.id,
    );
    if (rollbackErr) {
      // Caso raríssimo: profile insert falhou E rollback do auth user
      // também falhou. Resulta em orphan user em auth.users sem profile.
      // Loga server-side mas não expõe detalhes pro user final.
      console.error("[motoristas] rollback do auth user falhou", {
        userId: created.user.id,
      });
    }
    return { error: "Erro ao salvar motorista. Tente novamente." };
  }

  revalidatePath("/motoristas");
  redirect("/motoristas?msg=criado");
}

export async function updateMotorista(
  id: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const nome = String(fd.get("nome") ?? "").trim();
  const telefone = String(fd.get("telefone") ?? "").trim() || null;
  const ativo = fd.get("ativo") === "on";

  if (!nome) return { error: "Nome é obrigatório." };

  const auth = await requireMaster();
  if (!auth.ok) return { error: "Sem permissão." };

  // Cliente normal (RLS aplica via master_manages_org_profiles).
  // .eq("role", "motorista") é guard contra update acidental de
  // profile que não é motorista.
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ nome, telefone, ativo })
    .eq("id", id)
    .eq("role", "motorista");

  if (error) return { error: "Erro ao atualizar motorista." };

  revalidatePath("/motoristas");
  revalidatePath(`/motoristas/${id}`);
  redirect("/motoristas?msg=atualizado");
}

export async function deactivateMotorista(id: string): Promise<FormState> {
  const auth = await requireMaster();
  if (!auth.ok) return { error: "Sem permissão." };

  // Soft delete: ativo=false. NÃO apaga de auth.users (preserva
  // histórico de operações que o motorista fez).
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ ativo: false })
    .eq("id", id)
    .eq("role", "motorista");

  if (error) return { error: "Erro ao desativar motorista." };

  revalidatePath("/motoristas");
  redirect("/motoristas?msg=desativado");
}
