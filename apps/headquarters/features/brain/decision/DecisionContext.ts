"use client";

import { createContext } from "react";
import type { Decision } from "../types";

export interface DecisionContextValue {
  decisions: Decision[];
  activeDecisionId: string | null;
  activeDecision: Decision | null;
  selectDecision: (decisionId: string) => void;
  clearDecisionSelection: () => void;
  getDecisionById: (decisionId: string) => Decision | undefined;
  getDecisionsByWorkspace: (workspaceId: string) => Decision[];
}

export const DecisionContext = createContext<DecisionContextValue | null>(null);
