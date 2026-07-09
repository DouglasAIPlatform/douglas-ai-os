"use client";

import { createContext } from "react";
import type { RecentSearch, SearchResult } from "./types";

export interface SearchContextValue {
  query: string;
  results: SearchResult[];
  recentSearches: RecentSearch[];
  isSearching: boolean;
  widgetMocksEnabled: boolean;
  setQuery: (query: string) => void;
  submitSearch: (query?: string) => void;
  clearSearch: () => void;
  clearRecentSearches: () => void;
}

export const SearchContext = createContext<SearchContextValue | null>(null);
