/** Relatório determinístico do Release Readiness Agent — Sprint 5.52 */

import type { OperationalAgentManifest } from "./OperationalAgentTypes";

export type ReleaseReadinessVerdict =
  | "ready_for_staging"
  | "ready_for_production_review"
  | "blocked"
  | "insufficient_data";

export interface ReleaseReadinessEvidence {
  source: string;
  category: string;
  summary: string;
  outcome?: string;
}

export interface ReleaseReadinessBlocker {
  id: string;
  category: string;
  message: string;
  severity: "critical" | "high";
}

export interface ReleaseReadinessRecommendation {
  priority: "high" | "medium" | "low";
  message: string;
}

export interface ReleaseReadinessAgentReport {
  verdict: ReleaseReadinessVerdict;
  version: string;
  environment: string;
  releaseChannel: string;
  staticReadinessAvailable: boolean;
  runtimeReadinessHint: string;
  stagingStatus: string;
  blockers: ReleaseReadinessBlocker[];
  warnings: string[];
  evidence: ReleaseReadinessEvidence[];
  missionPersistenceSummary: string | null;
  auditHealthSummary: string | null;
  agentMetricsSummary: Array<{
    agentId: string;
    totalExecutions: number;
    successRate: number | null;
  }>;
  recommendations: ReleaseReadinessRecommendation[];
  readOnlyNotice: string;
  timestamp: string;
  executionId: string;
  correlationId: string;
}

export const RELEASE_READINESS_AGENT_ID = "release-readiness-agent";

export const RELEASE_READINESS_REVIEW_MISSION_TYPE = "release_readiness_review";

export const RELEASE_READINESS_AGENT_MANIFEST: OperationalAgentManifest = {
  id: RELEASE_READINESS_AGENT_ID,
  name: "Release Readiness Agent",
  department: "Governance",
  version: "1.0.0",
  description:
    "Agente operacional read-only que analisa snapshots internos e recomenda readiness — sem aprovar produção nem executar release.",
  capabilities: [
    "release:inspect",
    "staging:inspect",
    "environment:inspect",
    "safety:inspect",
    "audit:summary",
    "mission:persistence_inspect",
    "agent:metrics_inspect",
  ],
  readOnly: true,
  supportedMissionTypes: [RELEASE_READINESS_REVIEW_MISSION_TYPE],
};

export const RELEASE_READINESS_REQUIRED_CAPABILITIES = [
  "release:inspect",
] as const;

export const RELEASE_READINESS_FORBIDDEN_ACTIONS = [
  "release:approve_production",
  "deploy",
  "migration",
  "tag:create",
  "git:commit",
  "git:push",
  "shell:execute",
  "secret:access",
  "role:escalate",
  "config:critical",
  "service_role:access",
  "network:unrestricted",
] as const;
