"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

const STATUS_FILTERS = [
  { value: "todos", label: "Todas" },
  { value: "em_aberto", label: "Em aberto" },
  { value: "concluida", label: "Concluídas" },
] as const;

export function ManutencoesFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentStatus = searchParams.get("status") ?? "todos";
  const currentQ = searchParams.get("q") ?? "";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "todos") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    params.delete("msg");
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = currentStatus === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => updateParam("status", f.value)}
              disabled={isPending}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                active
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border text-text-muted hover:bg-surface-elevated hover:text-text"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
      <input
        key={currentQ}
        type="search"
        placeholder="Buscar por número do container..."
        defaultValue={currentQ}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            updateParam("q", e.currentTarget.value.trim());
          }
        }}
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (v !== currentQ) updateParam("q", v);
        }}
        className="w-72 rounded-md border border-border bg-surface px-3 py-1.5 text-sm placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
    </div>
  );
}
