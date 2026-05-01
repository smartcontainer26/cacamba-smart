"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { Cliente, FormState } from "../_types";
import { DeleteButton } from "./delete-button";

type FormAction = (prev: FormState, fd: FormData) => Promise<FormState>;

type Props =
  | { mode: "create"; action: FormAction; cliente?: undefined }
  | { mode: "edit"; action: FormAction; cliente: Cliente };

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

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  const label = pending
    ? mode === "create"
      ? "Salvando..."
      : "Atualizando..."
    : mode === "create"
      ? "Salvar"
      : "Salvar Alterações";
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
    >
      {label}
    </button>
  );
}

export function ClienteForm(props: Props) {
  const [state, formAction] = useActionState(props.action, INITIAL_STATE);
  const c = props.cliente;

  return (
    <form action={formAction} className="max-w-3xl space-y-5">
      {state.error && (
        <div className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Nome *" htmlFor="nome">
          <input
            id="nome"
            name="nome"
            required
            defaultValue={c?.nome ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Documento (CPF/CNPJ)" htmlFor="documento">
          <input
            id="documento"
            name="documento"
            defaultValue={c?.documento ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Telefone" htmlFor="telefone">
          <input
            id="telefone"
            name="telefone"
            defaultValue={c?.telefone ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={c?.email ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Endereço" htmlFor="endereco">
        <input
          id="endereco"
          name="endereco"
          defaultValue={c?.endereco ?? ""}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_120px]">
        <Field label="Cidade" htmlFor="cidade">
          <input
            id="cidade"
            name="cidade"
            defaultValue={c?.cidade ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="UF" htmlFor="estado">
          <input
            id="estado"
            name="estado"
            maxLength={2}
            placeholder="SP"
            defaultValue={c?.estado ?? ""}
            className={`${inputClass} uppercase`}
          />
        </Field>
      </div>

      <Field label="Observações" htmlFor="observacoes">
        <textarea
          id="observacoes"
          name="observacoes"
          rows={3}
          defaultValue={c?.observacoes ?? ""}
          className={inputClass}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="ativo"
          defaultChecked={c?.ativo ?? true}
          className="size-4 accent-accent"
        />
        <span>Ativo</span>
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex gap-3">
          <Link
            href="/clientes"
            className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-surface-elevated"
          >
            Cancelar
          </Link>
          <SubmitButton mode={props.mode} />
        </div>
        {props.mode === "edit" && <DeleteButton id={props.cliente.id} />}
      </div>
    </form>
  );
}
