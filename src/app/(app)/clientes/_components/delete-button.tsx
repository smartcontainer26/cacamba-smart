"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteCliente } from "../_actions/clientes";

export function DeleteButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteCliente(id);
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
        <Trash2 className="size-4" />
        Deletar
      </button>

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl shadow-black/40"
          >
            <h2 id="confirm-delete-title" className="mb-2 text-lg font-semibold">
              Tem certeza?
            </h2>
            <p className="mb-5 text-sm text-text-muted">
              Esta ação não pode ser desfeita.
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
                className="rounded-md bg-error px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? "Deletando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
