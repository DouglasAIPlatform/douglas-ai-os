"use client";

import { createContext, useContext, type ReactNode } from "react";
import type {
  AgentExecutionReport,
  AgentSessionMetrics,
  OperationalAgentManifest,
  OperationalAgentRuntime,
  ReleaseReadinessAgentReport,
} from "@douglas/agents";
import {
  RELEASE_READINESS_AGENT_ID,
  SYSTEM_DIAGNOSTICS_AGENT_ID,
} from "@douglas/agents";

export interface OperationalAgentContextValue {
  agentRuntime: OperationalAgentRuntime;
  getDiagnosticsAgentMetrics: () => AgentSessionMetrics;
  getDiagnosticsAgentManifest: () => OperationalAgentManifest | undefined;
  getLastDiagnosticsReport: () => AgentExecutionReport | undefined;
  getDiagnosticsAgentStatus: () => string;
  getReleaseReadinessAgentMetrics: () => AgentSessionMetrics;
  getReleaseReadinessAgentManifest: () => OperationalAgentManifest | undefined;
  getLastReleaseReadinessReport: () => ReleaseReadinessAgentReport | undefined;
  getReleaseReadinessAgentStatus: () => string;
  listRegisteredAgents: () => OperationalAgentManifest[];
}

const OperationalAgentContext = createContext<OperationalAgentContextValue | null>(null);

export function OperationalAgentProvider({
  agentRuntime,
  children,
}: {
  agentRuntime: OperationalAgentRuntime;
  children: ReactNode;
}) {
  const registry = agentRuntime.getRegistry();

  const value: OperationalAgentContextValue = {
    agentRuntime,
    getDiagnosticsAgentMetrics: () => agentRuntime.getMetrics(SYSTEM_DIAGNOSTICS_AGENT_ID),
    getDiagnosticsAgentManifest: () => registry.get(SYSTEM_DIAGNOSTICS_AGENT_ID),
    getLastDiagnosticsReport: () => registry.getLastReport(SYSTEM_DIAGNOSTICS_AGENT_ID),
    getDiagnosticsAgentStatus: () => registry.getStatus(SYSTEM_DIAGNOSTICS_AGENT_ID),
    getReleaseReadinessAgentMetrics: () => agentRuntime.getMetrics(RELEASE_READINESS_AGENT_ID),
    getReleaseReadinessAgentManifest: () => registry.get(RELEASE_READINESS_AGENT_ID),
    getLastReleaseReadinessReport: () =>
      registry.getLastReleaseReadinessReport(RELEASE_READINESS_AGENT_ID),
    getReleaseReadinessAgentStatus: () => registry.getStatus(RELEASE_READINESS_AGENT_ID),
    listRegisteredAgents: () => registry.list(),
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
