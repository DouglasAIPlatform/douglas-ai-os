"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useDemoData } from "@douglas/demo-data";
import { SearchContext } from "./SearchContext";
import { SearchEngine } from "./SearchEngine";
import { createSearchIndex } from "./SearchIndex";
import type { RecentSearch } from "./types";

interface SearchProviderProps {
  children: ReactNode;
}

function createRecentSearch(query: string): RecentSearch {
  return {
    id: `recent:${query.toLowerCase()}`,
    query,
    createdAt: new Date().toISOString(),
  };
}

export function SearchProvider({ children }: SearchProviderProps) {
  const { isSourceEnabled } = useDemoData();
  const widgetMocksEnabled = isSourceEnabled("widget_mocks");
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const index = useMemo(
    () => createSearchIndex({ includeWidgetMocks: widgetMocksEnabled }),
    [widgetMocksEnabled],
  );
  const engine = useMemo(() => new SearchEngine(index), [index]);

  const results = useMemo(() => engine.search(query), [engine, query]);

  function submitSearch(nextQuery = query) {
    const normalizedQuery = nextQuery.trim();

    if (!normalizedQuery) return;

    setRecentSearches((currentSearches) => [
      createRecentSearch(normalizedQuery),
      ...currentSearches.filter(
        (search) => search.query.toLowerCase() !== normalizedQuery.toLowerCase(),
      ),
    ].slice(0, 6));
  }

  function clearSearch() {
    setQuery("");
  }

  function clearRecentSearches() {
    setRecentSearches([]);
  }

  const value = useMemo(
    () => ({
      query,
      results,
      recentSearches,
      isSearching: false,
      widgetMocksEnabled,
      setQuery,
      submitSearch,
      clearSearch,
      clearRecentSearches,
    }),
    [query, recentSearches, results, widgetMocksEnabled],
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}
