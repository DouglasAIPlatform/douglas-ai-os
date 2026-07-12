"use client";

import type { AgentExecutionHistoryRepository } from "@douglas/agents";
import { createContext, useContext, type ReactNode } from "react";

const AgentExecutionHistoryContext = createContext<AgentExecutionHistoryRepository | null>(null);

export function AgentExecutionHistoryProvider({
  repository,
  children,
}: {
  repository: AgentExecutionHistoryRepository;
  children: ReactNode;
}) {
  return (
    <AgentExecutionHistoryContext.Provider value={repository}>
      {children}
    </AgentExecutionHistoryContext.Provider>
  );
}

export function useAgentExecutionHistoryRepository() {
  const context = useContext(AgentExecutionHistoryContext);
  if (!context) {
    throw new Error(
      "useAgentExecutionHistoryRepository must be used within AgentExecutionHistoryProvider.",
    );
  }
  return context;
}
