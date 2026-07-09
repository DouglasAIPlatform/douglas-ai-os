"use client";

import { createContext } from "react";
import type { Memory } from "../types";

export interface MemoryContextValue {
  memories: Memory[];
  activeMemoryId: string | null;
  activeMemory: Memory | null;
  selectMemory: (memoryId: string) => void;
  clearMemorySelection: () => void;
  getMemoryById: (memoryId: string) => Memory | undefined;
  getMemoriesByWorkspace: (workspaceId: string) => Memory[];
}

export const MemoryContext = createContext<MemoryContextValue | null>(null);
