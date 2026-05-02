// Sub-layout que aplica gate de role='master' em toda rota /motoristas/*.
// Roda DEPOIS do (app)/layout.tsx (que já gateou auth + profile).
// Não-master é redirecionado pro dashboard.

import { redirect } from "next/navigation";
import { requireMaster } from "./_lib/require-master";

export default async function MotoristasLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const result = await requireMaster();
  if (!result.ok) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
