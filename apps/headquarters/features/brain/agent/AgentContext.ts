"use client";

import { createContext } from "react";
import type { BrainAgent } from "../types";

export interface AgentContextValue {
  agents: BrainAgent[];
  activeAgentId: string | null;
  activeAgent: BrainAgent | null;
  selectAgent: (agentId: string) => void;
  clearAgentSelection: () => void;
  getAgentById: (agentId: string) => BrainAgent | undefined;
  getAgentsByWorkspace: (workspaceId: string) => BrainAgent[];
}

export const AgentContext = createContext<AgentContextValue | null>(null);
