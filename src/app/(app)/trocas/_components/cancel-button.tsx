"use client";

import { useState, useTransition } from "react";
import { Ban } from "lucide-react";
import { cancelarTroca } from "../_actions/trocas";

export function CancelButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await cancelarTroca(id);
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
        className="inline-flex items-center gap-1.5 rounded-md border border-error/40 bg-error/10 px-4 py-2 text-sm font-medium text-error transition-colors hover:bg-error/20"
      >
        <Ban className="size-4" />
        Cancelar troca
      </button>

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-cancel-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl shadow-black/40"
          >
            <h2
              id="confirm-cancel-title"
              className="mb-2 text-lg font-semibold"
            >
              Cancelar troca?
            </h2>
            <p className="mb-5 text-sm text-text-muted">
              Os containers vão voltar ao estado anterior. A troca fica
              marcada como cancelada (não é apagada).
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
                Manter
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="rounded-md bg-error px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? "Cancelando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
