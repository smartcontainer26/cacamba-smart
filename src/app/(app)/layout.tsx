import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "./_components/sidebar";
import { LogoutButton } from "./_components/logout-button";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  // Defesa em profundidade: o middleware já redireciona não-logados,
  // mas validamos de novo aqui caso o middleware seja bypassed.
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

  // Erro do banco precisa subir como exceção — sem isso, qualquer falha
  // de query (schema, conexão, policy) vira "Conta não vinculada"
  // silencioso e perdemos o diagnóstico.
  if (profileError) {
    throw profileError;
  }

  // Conta autenticada mas sem profile vinculado a uma empresa.
  // Tela mínima full-screen, sem sidebar (não há dados de profile
  // pra preencher o rodapé).
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

  return (
    <div className="min-h-screen">
      <Sidebar
        profile={{ nome: profile.nome, role: profile.role }}
        userEmail={user.email ?? ""}
      />
      <main className="md:ml-[280px]">{children}</main>
    </div>
  );
}
