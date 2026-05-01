import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Defesa em profundidade: o proxy já redireciona não-logados,
  // mas validamos de novo aqui caso o proxy seja bypassed.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, nome, email, role, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  // Erro real do banco (RLS recursivo, schema, conexão...) precisa subir
  // pra superfície — caso contrário o usuário vê "Conta não vinculada"
  // como fallback genérico e perdemos o diagnóstico.
  if (profileError) {
    console.error("[dashboard] profile query failed:", {
      code: profileError.code,
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
    });
    throw new Error(
      `Falha ao carregar profile: ${profileError.code ?? "?"} ${profileError.message ?? ""}`,
    );
  }

  // Conta autenticada mas sem profile vinculado a uma empresa.
  // Tela mínima: só a mensagem e botão Sair, sem nav/dados.
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-2xl shadow-black/30">
          <h1 className="mb-3 text-xl font-semibold">Conta não vinculada</h1>
          <p className="mb-6 text-sm text-text-muted">
            Sua conta ainda não foi vinculada a uma empresa. Entre em contato
            com o administrador do Caçamba Smart.
          </p>
          <div className="flex justify-center">
            <LogoutButton />
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile.nome?.trim() || user.email;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-text-muted">Bem-vindo,</p>
          <h1 className="mt-0.5 text-2xl font-semibold">{displayName}</h1>
          <p className="mt-1 text-xs text-text-muted">
            Perfil: <span className="text-accent">{profile.role}</span>
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-text-muted">
          Dashboard placeholder. KPIs e widgets vêm na próxima etapa.
        </p>
      </div>
    </div>
  );
}
