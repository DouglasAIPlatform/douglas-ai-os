/** Contratos da acceptance suite — Sprint 5.55. */

export type StagingPersistenceAcceptanceStatus =
  | "not_run"
  | "running"
  | "passed"
  | "passed_with_warnings"
  | "failed"
  | "blocked";

export type StagingPersistenceAcceptanceScenarioId =
  | "system_diagnostics"
  | "release_readiness"
  | "recovery"
  | "fallback_detection"
  | "multi_agent_isolation";

export type StagingPersistenceAcceptanceStepStatus =
  | "pending"
  | "running"
  | "passed"
  | "warning"
  | "failed"
  | "blocked"
  | "skipped";

export interface StagingPersistenceAcceptanceStep {
  id: string;
  label: string;
  status: StagingPersistenceAcceptanceStepStatus;
  message: string;
}

export interface StagingPersistenceAcceptanceEvidence {
  kind: string;
  summary: string;
  executionId?: string;
  agentId?: string;
  missionType?: string;
  sanitized: true;
}

export interface StagingPersistenceAcceptanceScenario {
  id: StagingPersistenceAcceptanceScenarioId;
  label: string;
  description: string;
  missionType?: string;
  agentId?: string;
  steps: StagingPersistenceAcceptanceStep[];
  status: StagingPersistenceAcceptanceStatus;
  blockers: string[];
  warnings: string[];
  evidence: StagingPersistenceAcceptanceEvidence[];
}

export interface StagingPersistenceAcceptanceReport {
  status: StagingPersistenceAcceptanceStatus;
  environment: string;
  startedAt?: string;
  completedAt?: string;
  summary: string;
  scenarios: StagingPersistenceAcceptanceScenario[];
  blockers: string[];
  warnings: string[];
  passedCount: number;
  failedCount: number;
  blockedCount: number;
}

export interface StagingPersistenceAcceptanceEligibility {
  allowed: boolean;
  reason: string;
}
