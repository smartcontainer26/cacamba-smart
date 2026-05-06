// Helper compartilhado: garante que o caller é master da própria org.
// Usado por:
// - motoristas/layout.tsx (gate de acesso à rota)
// - motoristas/_actions/motoristas.ts (defense-in-depth nas ações)
//
// NÃO tem "use server" — é uma função de servidor comum, importada por
// outros server components/actions. Não fica callable do client.

import { createClient } from "@/lib/supabase/server";

export type MasterCheck =
  | { ok: true; userId: string; orgId: string }
  | { ok: false; reason: "no-session" | "no-org" | "not-master" };

export async function requireMaster(): Promise<MasterCheck> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "no-session" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.organization_id) return { ok: false, reason: "no-org" };
  if (profile.role !== "master") return { ok: false, reason: "not-master" };

  return { ok: true, userId: user.id, orgId: profile.organization_id };
}
