"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMaster } from "../../_lib/require-master";
import { OPERACAO_TYPES, type OperacaoType, type FormState } from "../_types";

const isValidOperacao = (s: string): s is OperacaoType =>
  (OPERACAO_TYPES as readonly string[]).includes(s);

type ContainerSnapshot = {
  status: string;
  cliente_atual_id: string | null;
  data_entrega: string | null;
};

type SupabaseSrv = Awaited<ReturnType<typeof createClient>>;

async function fetchContainerSnapshot(
  supabase: SupabaseSrv,
  id: string,
): Promise<ContainerSnapshot | null> {
  const { data } = await supabase
    .from("containers")
    .select("status, cliente_atual_id, data_entrega")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

async function revertContainer(
  supabase: SupabaseSrv,
  id: string,
  snapshot: ContainerSnapshot,
): Promise<void> {
  await supabase
    .from("containers")
    .update({
      status: snapshot.status,
      cliente_atual_id: snapshot.cliente_atual_id,
      data_entrega: snapshot.data_entrega,
    })
    .eq("id", id);
}

export async function createTroca(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  // Parse
  const operacaoRaw = String(fd.get("operacao") ?? "");
  const cliente_id = String(fd.get("cliente_id") ?? "").trim();
  const container_retirado_raw =
    String(fd.get("container_retirado_id") ?? "").trim() || null;
  const container_entregue_raw =
    String(fd.get("container_entregue_id") ?? "").trim() || null;
  const motorista_id =
    String(fd.get("motorista_id") ?? "").trim() || null;
  const data_troca = String(fd.get("data_troca") ?? "").trim();
  const observacoes =
    String(fd.get("observacoes") ?? "").trim() || null;

  // Validação tipo + cliente
  if (!isValidOperacao(operacaoRaw)) {
    return { error: "Tipo de operação inválido." };
  }
  if (!cliente_id) {
    return { error: "Selecione um cliente." };
  }

  // Normaliza containers conforme o modo (defesa contra form manipulado)
  const finalRetirado =
    operacaoRaw === "primeira_entrega" ? null : container_retirado_raw;
  const finalEntregue =
    operacaoRaw === "retirada_final" ? null : container_entregue_raw;

  if ((operacaoRaw === "primeira_entrega" || operacaoRaw === "troca") && !finalEntregue) {
    return { error: "Selecione o container a ser entregue." };
  }
  if ((operacaoRaw === "troca" || operacaoRaw === "retirada_final") && !finalRetirado) {
    return { error: "Selecione o container a ser retirado." };
  }

  // Validação data
  if (!data_troca) {
    return { error: "Data da operação é obrigatória." };
  }
  const dataDate = new Date(data_troca);
  if (isNaN(dataDate.getTime())) {
    return { error: "Data inválida." };
  }
  // Tolera 5min de drift de relógio (servidor vs browser)
  if (dataDate.getTime() > Date.now() + 5 * 60 * 1000) {
    return { error: "Data da operação não pode ser futura." };
  }

  // Defense-in-depth: caller é master
  const auth = await requireMaster();
  if (!auth.ok) {
    return { error: "Apenas usuários master podem cadastrar trocas." };
  }

  const supabase = await createClient();

  // 1. Lê estado original dos containers (pra rollback se algo falhar)
  const origRetirado = finalRetirado
    ? await fetchContainerSnapshot(supabase, finalRetirado)
    : null;
  const origEntregue = finalEntregue
    ? await fetchContainerSnapshot(supabase, finalEntregue)
    : null;

  // 2. Valida estados
  if (finalRetirado) {
    if (!origRetirado) {
      return { error: "Container a retirar não encontrado." };
    }
    if (origRetirado.status !== "em_uso") {
      return { error: "Container a retirar não está em uso." };
    }
    if (origRetirado.cliente_atual_id !== cliente_id) {
      return { error: "Container a retirar não está vinculado a este cliente." };
    }
  }
  if (finalEntregue) {
    if (!origEntregue) {
      return { error: "Container a entregar não encontrado." };
    }
    if (origEntregue.status !== "disponivel") {
      return { error: "Container a entregar não está disponível." };
    }
  }

  // 3. UPDATE container_retirado → libera (disponivel, sem cliente)
  if (finalRetirado) {
    const { error } = await supabase
      .from("containers")
      .update({ status: "disponivel", cliente_atual_id: null })
      .eq("id", finalRetirado);
    if (error) {
      console.error(
        "[createTroca] falha ao atualizar container retirado:",
        error,
      );
      return { error: "Erro ao atualizar container retirado." };
    }
  }

  // 4. UPDATE container_entregue → vincula (em_uso, cliente, data)
  if (finalEntregue) {
    const { error } = await supabase
      .from("containers")
      .update({
        status: "em_uso",
        cliente_atual_id: cliente_id,
        data_entrega: data_troca,
      })
      .eq("id", finalEntregue);
    if (error) {
      console.error(
        "[createTroca] falha ao atualizar container entregue:",
        error,
      );
      // Rollback do passo 3
      if (finalRetirado && origRetirado) {
        await revertContainer(supabase, finalRetirado, origRetirado);
      }
      return { error: "Erro ao atualizar container entregue." };
    }
  }

  // 5. INSERT na tabela trocas (master cadastrando = aprovada direta)
  const { error: insertErr } = await supabase.from("trocas").insert({
    organization_id: auth.orgId,
    cliente_id,
    container_retirado_id: finalRetirado,
    container_entregue_id: finalEntregue,
    motorista_id,
    observacoes,
    status: "aprovada",
    aprovada_por: auth.userId,
    aprovada_em: new Date().toISOString(),
    data_troca,
  });

  if (insertErr) {
    console.error("[createTroca] falha no INSERT da troca:", insertErr);
    // Rollback de ambos containers
    if (finalRetirado && origRetirado) {
      await revertContainer(supabase, finalRetirado, origRetirado);
    }
    if (finalEntregue && origEntregue) {
      await revertContainer(supabase, finalEntregue, origEntregue);
    }
    return { error: "Erro ao salvar troca. Tente novamente." };
  }

  // TODO: race condition entre snapshot (passo 1) e update (3-4) — em
  // baixa concorrência é improvável. Se virar problema, migrar pra RPC
  // (Postgres function com transação ACID real).

  revalidatePath("/trocas");
  revalidatePath("/containers");
  redirect("/trocas?msg=criada");
}

export async function cancelarTroca(id: string): Promise<FormState> {
  const auth = await requireMaster();
  if (!auth.ok) return { error: "Sem permissão." };

  const supabase = await createClient();

  // Lê troca atual
  const { data: troca, error: fetchErr } = await supabase
    .from("trocas")
    .select(
      "id, status, cliente_id, container_retirado_id, container_entregue_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !troca) {
    if (fetchErr) {
      console.error("[cancelarTroca] falha ao buscar troca:", fetchErr);
    }
    return { error: "Troca não encontrada." };
  }
  if (troca.status !== "aprovada") {
    return { error: "Apenas trocas aprovadas podem ser canceladas." };
  }

  // Reverte: container_retirado volta pra em_uso vinculado ao cliente
  if (troca.container_retirado_id) {
    const { error } = await supabase
      .from("containers")
      .update({
        status: "em_uso",
        cliente_atual_id: troca.cliente_id,
      })
      .eq("id", troca.container_retirado_id);
    if (error) {
      console.error(
        "[cancelarTroca] falha ao reverter container retirado:",
        error,
      );
      return { error: "Erro ao reverter container retirado." };
    }
  }

  // Reverte: container_entregue volta pra disponivel sem cliente
  if (troca.container_entregue_id) {
    const { error } = await supabase
      .from("containers")
      .update({
        status: "disponivel",
        cliente_atual_id: null,
      })
      .eq("id", troca.container_entregue_id);
    if (error) {
      console.error(
        "[cancelarTroca] falha ao reverter container entregue:",
        error,
      );
      return { error: "Erro ao reverter container entregue." };
    }
  }

  // Marca troca como cancelada
  const { error: updateErr } = await supabase
    .from("trocas")
    .update({ status: "cancelada" })
    .eq("id", id);

  if (updateErr) {
    console.error(
      "[cancelarTroca] falha ao marcar troca como cancelada:",
      updateErr,
    );
    return { error: "Erro ao marcar troca como cancelada." };
  }

  revalidatePath("/trocas");
  revalidatePath(`/trocas/${id}`);
  revalidatePath("/containers");
  redirect("/trocas?msg=cancelada");
}

export async function atualizarObservacoes(
  id: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const auth = await requireMaster();
  if (!auth.ok) return { error: "Sem permissão." };

  const observacoes = String(fd.get("observacoes") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("trocas")
    .update({ observacoes })
    .eq("id", id);

  if (error) {
    console.error("[atualizarObservacoes] falha ao atualizar:", error);
    return { error: "Erro ao atualizar observações." };
  }

  revalidatePath(`/trocas/${id}`);
  redirect(`/trocas/${id}?msg=observacoes_atualizadas`);
}
