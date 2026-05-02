import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { MotoristaForm } from "../_components/motorista-form";
import { createMotorista } from "../_actions/motoristas";

export default function NovoMotoristaPage() {
  return (
    <div className="px-8 py-10">
      <div className="mb-6">
        <Link
          href="/motoristas"
          className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ChevronLeft className="size-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-semibold">Novo Motorista</h1>
      </div>
      <MotoristaForm mode="create" action={createMotorista} />
    </div>
  );
}
