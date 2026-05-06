"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMaster } from "../../_lib/require-master";
import type { FormState } from "../_types";

type SupabaseSrv = Awaited<ReturnType<typeof createClient>>;

type ContainerSnapshot = {
  status: string;
};

async function fetchContainerSnapshot(
  supabase: SupabaseSrv,
  id: string,
): Promise<ContainerSnapshot | null> {
  const { data } = await supabase
    .from("containers")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

export async function createManutencao(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  // Parse + validação de campos
  const container_id = String(fd.get("container_id") ?? "").trim();
  const data_inicio = String(fd.get("data_inicio") ?? "").trim();
  const descricao = String(fd.get("descricao") ?? "").trim() || null;

  if (!container_id) return { error: "Selecione um container." };
  if (!data_inicio) return { error: "Data de início é obrigatória." };

  const dataDate = new Date(data_inicio);
  if (isNaN(dataDate.getTime())) {
    return { error: "Data inválida." };
  }
  // Tolera 5min de drift de relógio (servidor vs browser) — mesmo padrão
  // de createTroca.
  if (dataDate.getTime() > Date.now() + 5 * 60 * 1000) {
    return { error: "Data de início não pode ser futura." };
  }

  // Defense-in-depth: caller é master
  const auth = await requireMaster();
  if (!auth.ok) {
    return { error: "Apenas usuários master podem cadastrar manutenções." };
  }

  const supabase = await createClient();

  // Snapshot do container — pra validar status='disponivel' E pra rollback
  const snapshot = await fetchContainerSnapshot(supabase, container_id);
  if (!snapshot) {
    return { error: "Container não encontrado." };
  }
  if (snapshot.status !== "disponivel") {
    return {
      error:
        "Container precisa estar disponível pra entrar em manutenção.",
    };
  }

  // Defesa em profundidade contra a UNIQUE parcial: confere que não há
  // manutenção aberta pra este container. A UNIQUE pega como segunda
  // camada se isso passar (race condition).
  const { data: aberta, error: abertaErr } = await supabase
    .from("manutencoes")
    .select("id")
    .eq("container_id", container_id)
    .is("data_fim", null)
    .limit(1);
  if (abertaErr) {
    console.error(
      "[createManutencao] falha ao checar manutenção aberta:",
      abertaErr,
    );
    return { error: "Erro ao validar manutenção. Tente novamente." };
  }
  if (aberta && aberta.length > 0) {
    return {
      error: "Já existe uma manutenção em aberto pra este container.",
    };
  }

  // 1. UPDATE container → 'manutencao'
  const { error: updateContainerErr } = await supabase
    .from("containers")
    .update({ status: "manutencao" })
    .eq("id", container_id);
  if (updateContainerErr) {
    console.error(
      "[createManutencao] falha ao atualizar container:",
      updateContainerErr,
    );
    return { error: "Erro ao atualizar container. Tente novamente." };
  }

  // 2. INSERT em manutencoes
  const { error: insertErr } = await supabase.from("manutencoes").insert({
    organization_id: auth.orgId,
    container_id,
    data_inicio,
    descricao,
  });

  if (insertErr) {
    // Rollback do UPDATE container
    const { error: rollbackErr } = await supabase
      .from("containers")
      .update({ status: snapshot.status })
      .eq("id", container_id);
    if (rollbackErr) {
      console.error(
        "[createManutencao] rollback do container falhou:",
        rollbackErr,
      );
    }

    if (insertErr.code === "23505") {
      console.error(
        "[createManutencao] UNIQUE violation (manutenção aberta):",
        insertErr,
      );
      return {
        error: "Já existe uma manutenção em aberto pra este container.",
      };
    }
    console.error("[createManutencao] falha no INSERT:", insertErr);
    return { error: "Erro ao salvar manutenção. Tente novamente." };
  }

  revalidatePath("/manutencao");
  revalidatePath("/containers");
  redirect("/manutencao?msg=criada");
}

export async function finalizarManutencao(id: string): Promise<FormState> {
  const auth = await requireMaster();
  if (!auth.ok) return { error: "Sem permissão." };

  const supabase = await createClient();

  // Lê manutenção atual
  const { data: manutencao, error: fetchErr } = await supabase
    .from("manutencoes")
    .select("id, container_id, data_fim")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) {
    console.error("[finalizarManutencao] falha ao buscar:", fetchErr);
    return { error: "Erro ao buscar manutenção." };
  }
  if (!manutencao) return { error: "Manutenção não encontrada." };
  if (manutencao.data_fim !== null) {
    return { error: "Esta manutenção já foi concluída." };
  }

  // 1. UPDATE manutencoes → data_fim = now
  const dataFim = new Date().toISOString();
  const { error: updateMntErr } = await supabase
    .from("manutencoes")
    .update({ data_fim: dataFim })
    .eq("id", id);
  if (updateMntErr) {
    console.error(
      "[finalizarManutencao] falha ao atualizar manutencao:",
      updateMntErr,
    );
    return { error: "Erro ao finalizar manutenção. Tente novamente." };
  }

  // 2. UPDATE container → 'disponivel'
  const { error: updateCntErr } = await supabase
    .from("containers")
    .update({ status: "disponivel" })
    .eq("id", manutencao.container_id);
  if (updateCntErr) {
    console.error(
      "[finalizarManutencao] falha ao atualizar container:",
      updateCntErr,
    );
    // Rollback: reverte data_fim pra null
    const { error: rollbackErr } = await supabase
      .from("manutencoes")
      .update({ data_fim: null })
      .eq("id", id);
    if (rollbackErr) {
      console.error(
        "[finalizarManutencao] rollback do data_fim falhou:",
        rollbackErr,
      );
    }
    return { error: "Erro ao atualizar container. Tente novamente." };
  }

  revalidatePath("/manutencao");
  revalidatePath(`/manutencao/${id}`);
  revalidatePath("/containers");
  redirect("/manutencao?msg=finalizada");
}

export async function atualizarDescricao(
  id: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const auth = await requireMaster();
  if (!auth.ok) return { error: "Sem permissão." };

  const descricao = String(fd.get("descricao") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("manutencoes")
    .update({ descricao })
    .eq("id", id);

  if (error) {
    console.error("[atualizarDescricao] falha:", error);
    return { error: "Erro ao atualizar descrição." };
  }

  revalidatePath(`/manutencao/${id}`);
  redirect(`/manutencao/${id}?msg=descricao_atualizada`);
}
