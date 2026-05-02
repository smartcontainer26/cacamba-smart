"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { Motorista, FormState } from "../_types";
import { DeactivateButton } from "./deactivate-button";

type FormAction = (prev: FormState, fd: FormData) => Promise<FormState>;

type Props =
  | { mode: "create"; action: FormAction; motorista?: undefined }
  | { mode: "edit"; action: FormAction; motorista: Motorista };

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

export function MotoristaForm(props: Props) {
  const [state, formAction] = useActionState(props.action, INITIAL_STATE);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
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
            defaultValue={props.motorista?.nome ?? ""}
            className={inputClass}
          />
        </Field>
        {props.mode === "create" ? (
          <Field label="Email *" htmlFor="email">
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="off"
              className={inputClass}
            />
          </Field>
        ) : (
          <Field label="Email" htmlFor="email">
            <input
              id="email"
              type="email"
              value={props.motorista.email}
              readOnly
              disabled
              className={`${inputClass} cursor-not-allowed opacity-60`}
            />
          </Field>
        )}
      </div>

      {props.mode === "create" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Senha * (mínimo 6 caracteres)" htmlFor="password">
            <input
              id="password"
              name="password"
              type="password"
              minLength={6}
              required
              autoComplete="new-password"
              className={inputClass}
            />
          </Field>
          <Field label="Telefone" htmlFor="telefone">
            <input
              id="telefone"
              name="telefone"
              className={inputClass}
            />
          </Field>
        </div>
      ) : (
        <Field label="Telefone" htmlFor="telefone">
          <input
            id="telefone"
            name="telefone"
            defaultValue={props.motorista.telefone ?? ""}
            className={inputClass}
          />
        </Field>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="ativo"
          defaultChecked={props.motorista?.ativo ?? true}
          className="size-4 accent-accent"
        />
        <span>Ativo</span>
      </label>

      {props.mode === "edit" && (
        // TODO: alteração de email/senha em etapa futura
        <p className="text-xs text-text-muted">
          Email e senha não podem ser alterados aqui (em etapa futura).
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex gap-3">
          <Link
            href="/motoristas"
            className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-surface-elevated"
          >
            Cancelar
          </Link>
          <SubmitButton mode={props.mode} />
        </div>
        {props.mode === "edit" && (
          <DeactivateButton id={props.motorista.id} />
        )}
      </div>
    </form>
  );
}
