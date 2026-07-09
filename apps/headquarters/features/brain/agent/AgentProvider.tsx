"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { mockBrainAgents } from "../mocks";
import { useBrainMockState } from "../useBrainMockState";
import { AgentContext } from "./AgentContext";

interface AgentProviderProps {
  children: ReactNode;
}

export function AgentProvider({ children }: AgentProviderProps) {
  const agents = useBrainMockState(mockBrainAgents);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);

  const activeAgent = agents.find((agent) => agent.id === activeAgentId) ?? null;

  function getAgentById(agentId: string) {
    return agents.find((agent) => agent.id === agentId);
  }

  function getAgentsByWorkspace(workspaceId: string) {
    return agents.filter((agent) => agent.workspaceId === workspaceId);
  }

  const value = useMemo(
    () => ({
      agents,
      activeAgentId,
      activeAgent,
      selectAgent: setActiveAgentId,
      clearAgentSelection: () => setActiveAgentId(null),
      getAgentById,
      getAgentsByWorkspace,
    }),
    [activeAgent, activeAgentId, agents],
  );

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}
