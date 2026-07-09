"use client";

import { createContext } from "react";
import type { MemoryStore } from "./MemoryStore";
import type { MemoryStoreRegistry } from "./MemoryStoreRegistry";
import type {
  MemoryBackendProvider,
  MemoryFilter,
  MemoryHistoryEntry,
  MemoryIndexSnapshot,
  MemoryRecord,
  MemorySearchQuery,
  MemorySearchResult,
  MemoryWriteInput,
} from "./MemoryTypes";

export interface MemoryContextValue {
  store: MemoryStore;
  registry: MemoryStoreRegistry;
  backends: MemoryBackendProvider[];
  records: MemoryRecord[];
  snapshot: MemoryIndexSnapshot;
  activeRecordId: string | null;
  activeRecord: MemoryRecord | null;
  selectRecord: (recordId: string) => void;
  clearRecordSelection: () => void;
  write: (input: MemoryWriteInput) => MemoryRecord | null;
  read: (recordId: string) => MemoryRecord | undefined;
  update: (recordId: string, patch: Partial<MemoryWriteInput>) => MemoryRecord | null;
  remove: (recordId: string) => boolean;
  list: (filter?: MemoryFilter) => MemoryRecord[];
  search: (query?: MemorySearchQuery) => MemorySearchResult[];
  getHistory: (recordId: string) => MemoryHistoryEntry[];
  getRecentHistory: (limit?: number) => MemoryHistoryEntry[];
}

export const MemoryContext = createContext<MemoryContextValue | null>(null);
