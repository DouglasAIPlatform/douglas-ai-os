"use client";

import { useSearch } from "./useSearch";

export function RecentSearches() {
  const { recentSearches, setQuery, submitSearch, clearRecentSearches } =
    useSearch();

  if (!recentSearches.length) {
    return (
      <p className="text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)]">
        Pesquisas recentes aparecerão aqui durante a sessão.
      </p>
    );
  }

  return (
    <div className="space-y-[var(--ds-space-3)]">
      <div className="flex items-center justify-between gap-[var(--ds-space-3)]">
        <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
          Pesquisas recentes
        </p>
        <button
          className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)] transition-colors hover:text-[var(--ds-color-text-primary)]"
          type="button"
          onClick={clearRecentSearches}
        >
          Limpar
        </button>
      </div>

      <div className="flex flex-wrap gap-[var(--ds-space-2)]">
        {recentSearches.map((search) => (
          <button
            key={search.id}
            className="rounded-[var(--ds-radius-full)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] px-[var(--ds-space-3)] py-[var(--ds-space-1-5)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)] transition-colors hover:bg-[var(--ds-color-surface-muted)] hover:text-[var(--ds-color-text-primary)]"
            type="button"
            onClick={() => {
              setQuery(search.query);
              submitSearch(search.query);
            }}
          >
            {search.query}
          </button>
        ))}
      </div>
    </div>
  );
}
