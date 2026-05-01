import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ContainerForm } from "../_components/container-form";
import { createContainer } from "../_actions/containers";

export default function NovoContainerPage() {
  return (
    <div className="px-8 py-10">
      <div className="mb-6">
        <Link
          href="/containers"
          className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ChevronLeft className="size-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-semibold">Novo Container</h1>
      </div>
      <ContainerForm mode="create" action={createContainer} />
    </div>
  );
}
