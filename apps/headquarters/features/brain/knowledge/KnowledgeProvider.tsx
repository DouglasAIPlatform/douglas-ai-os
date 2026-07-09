"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { mockKnowledge } from "../mocks";
import { useBrainMockState } from "../useBrainMockState";
import { KnowledgeContext } from "./KnowledgeContext";

interface KnowledgeProviderProps {
  children: ReactNode;
}

export function KnowledgeProvider({ children }: KnowledgeProviderProps) {
  const knowledge = useBrainMockState(mockKnowledge);
  const [activeKnowledgeId, setActiveKnowledgeId] = useState<string | null>(null);

  const activeKnowledge =
    knowledge.find((entry) => entry.id === activeKnowledgeId) ?? null;

  function getKnowledgeById(knowledgeId: string) {
    return knowledge.find((entry) => entry.id === knowledgeId);
  }

  function getKnowledgeByWorkspace(workspaceId: string) {
    return knowledge.filter((entry) => entry.workspaceId === workspaceId);
  }

  const value = useMemo(
    () => ({
      knowledge,
      activeKnowledgeId,
      activeKnowledge,
      selectKnowledge: setActiveKnowledgeId,
      clearKnowledgeSelection: () => setActiveKnowledgeId(null),
      getKnowledgeById,
      getKnowledgeByWorkspace,
    }),
    [activeKnowledge, activeKnowledgeId, knowledge],
  );

  return (
    <KnowledgeContext.Provider value={value}>{children}</KnowledgeContext.Provider>
  );
}
