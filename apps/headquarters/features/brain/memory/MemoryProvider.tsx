"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { mockMemories } from "../mocks";
import { useBrainMockState } from "../useBrainMockState";
import { MemoryContext } from "./MemoryContext";

interface MemoryProviderProps {
  children: ReactNode;
}

export function MemoryProvider({ children }: MemoryProviderProps) {
  const memories = useBrainMockState(mockMemories);
  const [activeMemoryId, setActiveMemoryId] = useState<string | null>(null);

  const activeMemory =
    memories.find((memory) => memory.id === activeMemoryId) ?? null;

  function getMemoryById(memoryId: string) {
    return memories.find((memory) => memory.id === memoryId);
  }

  function getMemoriesByWorkspace(workspaceId: string) {
    return memories.filter((memory) => memory.workspaceId === workspaceId);
  }

  const value = useMemo(
    () => ({
      memories,
      activeMemoryId,
      activeMemory,
      selectMemory: setActiveMemoryId,
      clearMemorySelection: () => setActiveMemoryId(null),
      getMemoryById,
      getMemoriesByWorkspace,
    }),
    [activeMemory, activeMemoryId, memories],
  );

  return (
    <MemoryContext.Provider value={value}>{children}</MemoryContext.Provider>
  );
}
