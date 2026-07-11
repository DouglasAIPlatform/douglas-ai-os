"use client";

import { createContext, useContext, type ReactNode } from "react";
import type {
  AgentExecutionReport,
  AgentSessionMetrics,
  OperationalAgentManifest,
  OperationalAgentRuntime,
} from "@douglas/agents";

export interface OperationalAgentContextValue {
  agentRuntime: OperationalAgentRuntime;
  getDiagnosticsAgentMetrics: () => AgentSessionMetrics;
  getDiagnosticsAgentManifest: () => OperationalAgentManifest | undefined;
  getLastDiagnosticsReport: () => AgentExecutionReport | undefined;
  getDiagnosticsAgentStatus: () => string;
}

const OperationalAgentContext = createContext<OperationalAgentContextValue | null>(null);

export function OperationalAgentProvider({
  agentRuntime,
  children,
}: {
  agentRuntime: OperationalAgentRuntime;
  children: ReactNode;
}) {
  const value: OperationalAgentContextValue = {
    agentRuntime,
    getDiagnosticsAgentMetrics: () =>
      agentRuntime.getMetrics("system-diagnostics-agent"),
    getDiagnosticsAgentManifest: () =>
      agentRuntime.getRegistry().get("system-diagnostics-agent"),
    getLastDiagnosticsReport: () =>
      agentRuntime.getRegistry().getLastReport("system-diagnostics-agent"),
    getDiagnosticsAgentStatus: () =>
      agentRuntime.getRegistry().getStatus("system-diagnostics-agent"),
  };

  return (
    <OperationalAgentContext.Provider value={value}>
      {children}
    </OperationalAgentContext.Provider>
  );
}

export function useOperationalAgent() {
  const context = useContext(OperationalAgentContext);
  if (!context) {
    throw new Error("useOperationalAgent must be used within OperationalAgentProvider.");
  }
  return context;
}
