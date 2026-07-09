"use client";

import { useSearch } from "./useSearch";

interface SearchInputProps {
  placeholder?: string;
}

export function SearchInput({
  placeholder = "Pesquisar projetos, departamentos, agentes, usuários e documentação...",
}: SearchInputProps) {
  const { query, setQuery, submitSearch, clearSearch } = useSearch();

  return (
    <form
      role="search"
      className="flex items-center gap-[var(--ds-space-2)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] px-[var(--ds-space-3)] py-[var(--ds-space-2)]"
      onSubmit={(event) => {
        event.preventDefault();
        submitSearch();
      }}
    >
      <input
        className="min-w-0 flex-1 bg-transparent text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-primary)] outline-none placeholder:text-[var(--ds-color-text-subtle)]"
        placeholder={placeholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {query ? (
        <button
          className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)] transition-colors hover:text-[var(--ds-color-text-primary)]"
          type="button"
          onClick={clearSearch}
        >
          Limpar
        </button>
      ) : null}
    </form>
  );
}
