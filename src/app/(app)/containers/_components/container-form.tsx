"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { STATUSES, type Container, type FormState } from "../_types";
import { DeleteButton } from "./delete-button";

const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  disponivel: "Disponível",
  em_uso: "Em uso",
  manutencao: "Manutenção",
  inativo: "Inativo",
};

type FormAction = (
  prev: FormState,
  fd: FormData,
) => Promise<FormState>;

type Props =
  | { mode: "create"; action: FormAction; container?: undefined }
  | { mode: "edit"; action: FormAction; container: Container };

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

export function ContainerForm(props: Props) {
  const [state, formAction] = useActionState(props.action, INITIAL_STATE);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {state.error && (
        <div className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Número *" htmlFor="numero">
          <input
            id="numero"
            name="numero"
            required
            defaultValue={props.container?.numero ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Tipo" htmlFor="tipo">
          <input
            id="tipo"
            name="tipo"
            placeholder="5m³, 10m³..."
            defaultValue={props.container?.tipo ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Status" htmlFor="status">
        <select
          id="status"
          name="status"
          defaultValue={props.container?.status ?? "disponivel"}
          className={inputClass}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Observações" htmlFor="observacoes">
        <textarea
          id="observacoes"
          name="observacoes"
          rows={3}
          defaultValue={props.container?.observacoes ?? ""}
          className={inputClass}
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex gap-3">
          <Link
            href="/containers"
            className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-surface-elevated"
          >
            Cancelar
          </Link>
          <SubmitButton mode={props.mode} />
        </div>
        {props.mode === "edit" && <DeleteButton id={props.container.id} />}
      </div>
    </form>
  );
}
