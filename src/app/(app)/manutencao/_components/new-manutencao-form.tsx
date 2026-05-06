"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { FormState } from "../_types";

type ContainerLite = { id: string; numero: string };

type FormAction = (prev: FormState, fd: FormData) => Promise<FormState>;

type Props = {
  action: FormAction;
  containers: ContainerLite[];
  defaultDataInicio: string;
};

const INITIAL_STATE: FormState = { error: null };

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-text-muted"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
    >
      {pending ? "Salvando..." : "Salvar"}
    </button>
  );
}

export function NewManutencaoForm(props: Props) {
  const [state, formAction] = useActionState(props.action, INITIAL_STATE);

  if (props.containers.length === 0) {
    return (
      <div className="max-w-2xl rounded-xl border border-border bg-surface p-6">
        <p className="mb-4 text-sm text-text-muted">
          Não há containers disponíveis no momento. Cadastre um container ou
          libere algum que esteja em uso/manutenção antes de iniciar uma nova
          manutenção.
        </p>
        <Link
          href="/manutencao"
          className="inline-block rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-surface-elevated"
        >
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {state.error && (
        <div className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {state.error}
        </div>
      )}

      <Field label="Container *" htmlFor="container_id">
        <select
          id="container_id"
          name="container_id"
          required
          className={inputClass}
        >
          <option value="">Selecione...</option>
          {props.containers.map((c) => (
            <option key={c.id} value={c.id}>
              #{c.numero}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Data e hora de início *" htmlFor="data_inicio">
        <input
          id="data_inicio"
          name="data_inicio"
          type="datetime-local"
          required
          defaultValue={props.defaultDataInicio}
          className={inputClass}
        />
      </Field>

      <Field label="Descrição" htmlFor="descricao">
        <textarea
          id="descricao"
          name="descricao"
          rows={3}
          placeholder="O que está sendo feito? (opcional)"
          className={inputClass}
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link
          href="/manutencao"
          className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-surface-elevated"
        >
          Cancelar
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
