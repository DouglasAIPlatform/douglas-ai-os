"use client";

import { createContext } from "react";

export interface BrainDomainCounts {
  conversations: number;
  agents: number;
  memories: number;
  prompts: number;
  tasks: number;
  decisions: number;
  knowledge: number;
}

export interface BrainContextValue {
  isReady: boolean;
  activeWorkspaceId: string | null;
  domainCounts: BrainDomainCounts;
}

export const BrainContext = createContext<BrainContextValue | null>(null);
