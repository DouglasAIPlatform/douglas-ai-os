import type { ReleaseReadinessPlatformSnapshot } from "@douglas/agents";

export interface ReleaseReadinessSnapshotInput {
  release: {
    version: string;
    channel: string;
    releaseStatus: string;
    environment: string;
    environmentLabel: string;
    versionConsistent: boolean;
    staticReadinessValid: boolean;
    runtimeReadinessHint: string;
    alerts: string[];
  };
  staging: {
    status: string;
    bootstrapStatus: string;
    effectiveEnvironment: string;
    blockingCount: number;
    pendingRuntimeCount: number;
    passedCount: number;
    blockers: string[];
    alerts: string[];
  };
  productionSafety: {
    status: string;
    environment: string;
    blockingCount: number;
    alertCount: number;
    suggestedNextSteps: string[];
  } | null;
  environment: {
    canonical: string;
    releaseChannel: string;
    effectiveEnvironment: string;
    declaredExplicitly: boolean;
    hasCriticalMismatch: boolean;
    warnings: string[];
  };
  auditIngest: {
    totalAttempts: number;
    accepted: number;
    rejected: number;
    failed: number;
    lastOutcome: string | null;
    lastError: string | null;
  };
  missionPersistence: {
    mode: string;
    activeAdapter: string;
    fallbackActive: boolean;
    pendingSyncCount: number;
    supabaseConfigured: boolean;
    lastError: string | null;
  } | null;
  agentMetrics: Array<{
    agentId: string;
    totalExecutions: number;
    completed: number;
    failed: number;
    successRate: number | null;
    insufficientSample: boolean;
    dataSource: string;
  }>;
}

export function buildReleaseReadinessSnapshotFromPlatform(
  input: ReleaseReadinessSnapshotInput,
): ReleaseReadinessPlatformSnapshot {
  return {
    release: {
      version: input.release.version,
      channel: input.release.channel,
      releaseStatus: input.release.releaseStatus,
      environment: input.release.environment,
      environmentLabel: input.release.environmentLabel,
      versionConsistent: input.release.versionConsistent,
      staticReadinessValid: input.release.staticReadinessValid,
      runtimeReadinessHint: input.release.runtimeReadinessHint,
      alerts: input.release.alerts,
    },
    staging: {
      status: input.staging.status,
      bootstrapStatus: input.staging.bootstrapStatus,
      effectiveEnvironment: input.staging.effectiveEnvironment,
      blockingCount: input.staging.blockingCount,
      pendingRuntimeCount: input.staging.pendingRuntimeCount,
      passedCount: input.staging.passedCount,
      blockers: input.staging.blockers,
      alerts: input.staging.alerts,
    },
    productionSafety: input.productionSafety,
    environment: input.environment,
    auditIngest: input.auditIngest,
    missionPersistence: input.missionPersistence,
    agentMetrics: input.agentMetrics,
  };
}
