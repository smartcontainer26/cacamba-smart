"use client";

import { useActionState, useState, useMemo } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  OPERACAO_TYPES,
  type OperacaoType,
  type FormState,
} from "../_types";

type ClienteLite = { id: string; nome: string };
type ContainerLite = {
  id: string;
  numero: string;
  status: string;
  cliente_atual_id: string | null;
};
type MotoristaLite = { id: string; nome: string | null; email: string };

type FormAction = (prev: FormState, fd: FormData) => Promise<FormState>;

type Props = {
  action: FormAction;
  clientes: ClienteLite[];
  containers: ContainerLite[];
  motoristas: MotoristaLite[];
};

const INITIAL_STATE: FormState = { error: null };

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

const OPERACAO_LABELS: Record<OperacaoType, string> = {
  primeira_entrega: "Primeira entrega",
  troca: "Troca",
  retirada_final: "Retirada final",
};

const OPERACAO_DESCRIPTIONS: Record<OperacaoType, string> = {
  primeira_entrega:
    "Cliente recebe um container pela primeira vez (sem retirada).",
  troca: "Container atual sai, container novo entra.",
  retirada_final:
    "Cliente termina o uso e o container é retirado (sem entrega).",
};

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

// datetime-local input precisa do formato YYYY-MM-DDTHH:mm (sem TZ).
function nowAsLocalDateTimeValue(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TrocaForm(props: Props) {
  const [state, formAction] = useActionState(props.action, INITIAL_STATE);
  const [operacao, setOperacao] = useState<OperacaoType>("troca");
  const [clienteId, setClienteId] = useState<string>("");

  // Container retirado: filtra os "em_uso" vinculados ao cliente selecionado.
  const containersRetirados = useMemo(() => {
    if (!clienteId) return [];
    return props.containers.filter(
      (c) => c.cliente_atual_id === clienteId && c.status === "em_uso",
    );
  }, [clienteId, props.containers]);

  // Container entregue: filtra os "disponivel".
  const containersEntregues = useMemo(() => {
    return props.containers.filter((c) => c.status === "disponivel");
  }, [props.containers]);

  const showRetirado = operacao === "troca" || operacao === "retirada_final";
  const showEntregue =
    operacao === "primeira_entrega" || operacao === "troca";

  return (
    <form action={formAction} className="max-w-3xl space-y-5">
      {state.error && (
        <div className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {state.error}
        </div>
      )}

      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-text-muted">
          Tipo de operação *
        </legend>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {OPERACAO_TYPES.map((op) => (
            <label
              key={op}
              className={`cursor-pointer rounded-md border px-3 py-3 transition-colors ${
                operacao === op
                  ? "border-accent bg-accent/10"
                  : "border-border hover:bg-surface-elevated"
              }`}
            >
              <input
                type="radio"
                name="operacao"
                value={op}
                checked={operacao === op}
                onChange={() => setOperacao(op)}
                className="sr-only"
              />
              <span className="block text-sm font-medium">
                {OPERACAO_LABELS[op]}
              </span>
              <span className="mt-1 block text-xs text-text-muted">
                {OPERACAO_DESCRIPTIONS[op]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Cliente *" htmlFor="cliente_id">
        <select
          id="cliente_id"
          name="cliente_id"
          required
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className={inputClass}
        >
          <option value="">Selecione um cliente...</option>
          {props.clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </Field>

      {showRetirado && (
        <Field
          label="Container a retirar *"
          htmlFor="container_retirado_id"
        >
          <select
            id="container_retirado_id"
            name="container_retirado_id"
            required={showRetirado}
            disabled={!clienteId}
            className={inputClass}
          >
            <option value="">
              {!clienteId
                ? "Selecione o cliente primeiro"
                : containersRetirados.length === 0
                  ? "Nenhum container vinculado a este cliente"
                  : "Selecione..."}
            </option>
            {containersRetirados.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.numero}
              </option>
            ))}
          </select>
        </Field>
      )}

      {showEntregue && (
        <Field
          label="Container a entregar *"
          htmlFor="container_entregue_id"
        >
          <select
            id="container_entregue_id"
            name="container_entregue_id"
            required={showEntregue}
            className={inputClass}
          >
            <option value="">
              {containersEntregues.length === 0
                ? "Nenhum container disponível"
                : "Selecione..."}
            </option>
            {containersEntregues.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.numero}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Data e hora da operação *" htmlFor="data_troca">
          <input
            id="data_troca"
            name="data_troca"
            type="datetime-local"
            required
            defaultValue={nowAsLocalDateTimeValue()}
            className={inputClass}
          />
        </Field>
        <Field label="Motorista" htmlFor="motorista_id">
          <select
            id="motorista_id"
            name="motorista_id"
            className={inputClass}
            defaultValue=""
          >
            <option value="">Sem motorista vinculado</option>
            {props.motoristas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome?.trim() || m.email}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Observações" htmlFor="observacoes">
        <textarea
          id="observacoes"
          name="observacoes"
          rows={3}
          className={inputClass}
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link
          href="/trocas"
          className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-surface-elevated"
        >
          Cancelar
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
