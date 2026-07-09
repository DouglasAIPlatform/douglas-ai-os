"use client";

import { StatusBadge } from "@douglas/ui";
import { useSearch } from "./useSearch";
import type { SearchEntityType } from "./types";

const typeLabel: Record<SearchEntityType, string> = {
  project: "Projeto",
  department: "Departamento",
  agent: "Agente",
  setting: "Configuração",
  user: "Usuário",
  documentation: "Documentação",
};

export function SearchResults() {
  const { query, results, submitSearch, widgetMocksEnabled } = useSearch();

  if (!query.trim()) {
    return (
      <div className="rounded-[var(--ds-radius-md)] border border-dashed border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
        <p className="text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)]">
          {widgetMocksEnabled
            ? "Digite para pesquisar no índice mockado da plataforma."
            : "Digite para pesquisar rotas e documentação (dados demo desligados)."}
        </p>
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="rounded-[var(--ds-radius-md)] border border-dashed border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
        <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
          Nenhum resultado encontrado.
        </p>
        <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)]">
          O mecanismo está pronto para receber fontes reais futuramente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-[var(--ds-space-2)]">
      {results.map((result) => (
        <button
          key={result.id}
          className="w-full rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)] text-left transition-colors hover:border-[var(--ds-color-border-strong)] hover:bg-[var(--ds-color-surface)] focus-visible:outline-none focus-visible:shadow-[var(--ds-shadow-focus)]"
          type="button"
          onClick={() => submitSearch(query)}
        >
          <div className="flex flex-col gap-[var(--ds-space-3)] sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                {result.title}
              </p>
              <p className="mt-[var(--ds-space-1)] line-clamp-2 text-[length:var(--ds-font-size-sm)] leading-[var(--ds-line-height-body)] text-[var(--ds-color-text-muted)]">
                {result.description}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-[var(--ds-space-2)]">
              <StatusBadge label={typeLabel[result.type]} variant="neutral" />
              <span className="text-[length:var(--ds-font-size-xs)] tabular-nums text-[var(--ds-color-text-subtle)]">
                {result.score}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
