/** Snapshots sanitizados para Release Readiness Agent — espelham contratos públicos read-only. */

export interface ReleaseStatusSnapshotRef {
  version: string;
  channel: string;
  releaseStatus: string;
  environment: string;
  environmentLabel: string;
  versionConsistent: boolean;
  staticReadinessValid: boolean;
  runtimeReadinessHint: string;
  alerts: string[];
}

export interface StagingReadinessSnapshotRef {
  status: string;
  bootstrapStatus: string;
  effectiveEnvironment: string;
  blockingCount: number;
  pendingRuntimeCount: number;
  passedCount: number;
  blockers: string[];
  alerts: string[];
}

export interface ProductionSafetySnapshotRef {
  status: string;
  environment: string;
  blockingCount: number;
  alertCount: number;
  suggestedNextSteps: string[];
}

export interface EnvironmentResolutionSnapshotRef {
  canonical: string;
  releaseChannel: string;
  effectiveEnvironment: string;
  declaredExplicitly: boolean;
  hasCriticalMismatch: boolean;
  warnings: string[];
}

export interface AuditIngestObservabilitySnapshotRef {
  totalAttempts: number;
  accepted: number;
  rejected: number;
  failed: number;
  lastOutcome: string | null;
  lastError: string | null;
}

export interface MissionPersistenceHealthSnapshotRef {
  mode: string;
  activeAdapter: string;
  fallbackActive: boolean;
  pendingSyncCount: number;
  supabaseConfigured: boolean;
  lastError: string | null;
}

export interface AgentMetricsSnapshotRef {
  agentId: string;
  totalExecutions: number;
  completed: number;
  failed: number;
  successRate: number | null;
  insufficientSample: boolean;
  dataSource: string;
}

export interface ReleaseReadinessPlatformSnapshot {
  release: ReleaseStatusSnapshotRef | null;
  staging: StagingReadinessSnapshotRef | null;
  productionSafety: ProductionSafetySnapshotRef | null;
  environment: EnvironmentResolutionSnapshotRef | null;
  auditIngest: AuditIngestObservabilitySnapshotRef | null;
  missionPersistence: MissionPersistenceHealthSnapshotRef | null;
  agentMetrics: AgentMetricsSnapshotRef[];
}

export interface ReleaseReadinessSnapshotSource {
  collect(): ReleaseReadinessPlatformSnapshot | Promise<ReleaseReadinessPlatformSnapshot>;
}

export function createEmptyReleaseReadinessSnapshot(): ReleaseReadinessPlatformSnapshot {
  return {
    release: null,
    staging: null,
    productionSafety: null,
    environment: null,
    auditIngest: null,
    missionPersistence: null,
    agentMetrics: [],
  };
}

export function createDeterministicReleaseReadinessSnapshot(
  overrides: Partial<ReleaseReadinessPlatformSnapshot> = {},
): ReleaseReadinessPlatformSnapshot {
  return {
    release: {
      version: "0.1.0",
      channel: "development",
      releaseStatus: "draft",
      environment: "development",
      environmentLabel: "Development",
      versionConsistent: true,
      staticReadinessValid: true,
      runtimeReadinessHint: "Use Production Safety Gate para readiness runtime.",
      alerts: [],
    },
    staging: {
      status: "passed_with_runtime_checks_pending",
      bootstrapStatus: "not_configured",
      effectiveEnvironment: "development",
      blockingCount: 0,
      pendingRuntimeCount: 2,
      passedCount: 6,
      blockers: [],
      alerts: [],
    },
    productionSafety: {
      status: "open",
      environment: "development",
      blockingCount: 0,
      alertCount: 0,
      suggestedNextSteps: ["Execute pnpm release:check antes de promover."],
    },
    environment: {
      canonical: "development",
      releaseChannel: "development",
      effectiveEnvironment: "development",
      declaredExplicitly: true,
      hasCriticalMismatch: false,
      warnings: [],
    },
    auditIngest: {
      totalAttempts: 5,
      accepted: 5,
      rejected: 0,
      failed: 0,
      lastOutcome: "accepted",
      lastError: null,
    },
    missionPersistence: {
      mode: "supabase_preferred",
      activeAdapter: "session",
      fallbackActive: false,
      pendingSyncCount: 0,
      supabaseConfigured: true,
      lastError: null,
    },
    agentMetrics: [
      {
        agentId: "system-diagnostics-agent",
        totalExecutions: 3,
        completed: 3,
        failed: 0,
        successRate: 1,
        insufficientSample: false,
        dataSource: "session",
      },
    ],
    ...overrides,
  };
}
