"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { mockDecisions } from "../mocks";
import { useBrainMockState } from "../useBrainMockState";
import { DecisionContext } from "./DecisionContext";

interface DecisionProviderProps {
  children: ReactNode;
}

export function DecisionProvider({ children }: DecisionProviderProps) {
  const decisions = useBrainMockState(mockDecisions);
  const [activeDecisionId, setActiveDecisionId] = useState<string | null>(null);

  const activeDecision =
    decisions.find((decision) => decision.id === activeDecisionId) ?? null;

  function getDecisionById(decisionId: string) {
    return decisions.find((decision) => decision.id === decisionId);
  }

  function getDecisionsByWorkspace(workspaceId: string) {
    return decisions.filter((decision) => decision.workspaceId === workspaceId);
  }

  const value = useMemo(
    () => ({
      decisions,
      activeDecisionId,
      activeDecision,
      selectDecision: setActiveDecisionId,
      clearDecisionSelection: () => setActiveDecisionId(null),
      getDecisionById,
      getDecisionsByWorkspace,
    }),
    [activeDecision, activeDecisionId, decisions],
  );

  return (
    <DecisionContext.Provider value={value}>{children}</DecisionContext.Provider>
  );
}
