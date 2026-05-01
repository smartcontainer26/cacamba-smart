import { redirect } from "next/navigation";

// O middleware (src/middleware.ts) já redireciona / pra /login ou /dashboard
// conforme a sessão. Esta página existe como fallback defensivo:
// se o middleware não rodar (matcher excluído, dev edge case), o usuário
// vai pra /dashboard e o próprio middleware/dashboard cuida do auth.
export default function Home() {
  redirect("/dashboard");
}
