"use client";

import { createContext } from "react";
import type { Knowledge } from "../types";

export interface KnowledgeContextValue {
  knowledge: Knowledge[];
  activeKnowledgeId: string | null;
  activeKnowledge: Knowledge | null;
  selectKnowledge: (knowledgeId: string) => void;
  clearKnowledgeSelection: () => void;
  getKnowledgeById: (knowledgeId: string) => Knowledge | undefined;
  getKnowledgeByWorkspace: (workspaceId: string) => Knowledge[];
}

export const KnowledgeContext = createContext<KnowledgeContextValue | null>(null);
