import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ClienteForm } from "../_components/cliente-form";
import { createCliente } from "../_actions/clientes";

export default function NovoClientePage() {
  return (
    <div className="px-8 py-10">
      <div className="mb-6">
        <Link
          href="/clientes"
          className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ChevronLeft className="size-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-semibold">Novo Cliente</h1>
      </div>
      <ClienteForm mode="create" action={createCliente} />
    </div>
  );
}
