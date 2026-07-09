export type SearchEntityType =
  | "project"
  | "department"
  | "agent"
  | "setting"
  | "user"
  | "documentation";

export interface SearchRecord {
  id: string;
  type: SearchEntityType;
  title: string;
  description: string;
  href?: string;
  keywords: string[];
  metadata?: Record<string, string | number | boolean>;
}

export interface SearchResult extends SearchRecord {
  score: number;
  matchedFields: string[];
}

export interface SearchIndex {
  records: SearchRecord[];
  version: string;
  source: "mock" | "supabase";
  generatedAt: string;
}

export interface RecentSearch {
  id: string;
  query: string;
  createdAt: string;
}

export interface SearchEngineOptions {
  limit?: number;
  minScore?: number;
}

export interface SearchProviderState {
  query: string;
  results: SearchResult[];
  recentSearches: RecentSearch[];
  isSearching: boolean;
}
