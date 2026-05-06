"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { finalizarManutencao } from "../_actions/manutencoes";

export function FinalizarButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await finalizarManutencao(id);
      // Em sucesso, server action chama redirect() e nunca retorna.
      if (result?.error) setError(result.error);
    });
  };

  const closeModal = () => {
    if (isPending) return;
    setConfirming(false);
    setError(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-success/40 bg-success/10 px-4 py-2 text-sm font-medium text-success transition-colors hover:bg-success/20"
      >
        <CheckCircle2 className="size-4" />
        Finalizar manutenção
      </button>

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-finalizar-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl shadow-black/40"
          >
            <h2
              id="confirm-finalizar-title"
              className="mb-2 text-lg font-semibold"
            >
              Finalizar manutenção?
            </h2>
            <p className="mb-5 text-sm text-text-muted">
              O container volta para disponível e a data de fim é registrada
              como agora.
            </p>
            {error && (
              <p className="mb-4 rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-surface-elevated disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="rounded-md bg-success px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? "Finalizando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
