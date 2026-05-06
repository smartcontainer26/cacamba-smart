"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "../_types";

type FormAction = (prev: FormState, fd: FormData) => Promise<FormState>;

const INITIAL_STATE: FormState = { error: null };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
    >
      {pending ? "Salvando..." : "Salvar descrição"}
    </button>
  );
}

export function DescricaoForm({
  initialValue,
  action,
}: {
  initialValue: string | null;
  action: FormAction;
}) {
  const [state, formAction] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <div className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {state.error}
        </div>
      )}
      <textarea
        name="descricao"
        rows={4}
        defaultValue={initialValue ?? ""}
        placeholder="Sem descrição"
        className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
      <div className="flex justify-end">
        <SaveButton />
      </div>
    </form>
  );
}
