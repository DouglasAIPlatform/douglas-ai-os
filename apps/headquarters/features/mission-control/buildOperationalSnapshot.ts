import type { OperationalPlatformSnapshot } from "@douglas/agents";

export interface OperationalSnapshotInput {
  runtime: {
    status: string;
    isRunning: boolean;
    uptimeMs: number;
    readyModuleCount: number;
    totalModuleCount: number;
    modules: Array<{ id: string; name: string; status: string; health: string }>;
  };
  health: {
    status: string;
    healthyCount: number;
    warningCount: number;
    criticalCount: number;
    offlineCount: number;
    modules: Array<{ moduleId: string; moduleName: string; status: string; message?: string }>;
  } | null;
  dependencyGraph: {
    status: string;
    issueCount: number;
    circularDependencyCount: number;
    criticalUnavailableCount: number;
    issues: Array<{ type: string; message: string; severity: string; moduleId?: string }>;
  } | null;
  events: {
    events: Array<{
      id: string;
      source: string;
      type: string;
      severity: string;
      message: string;
      timestamp: string;
    }>;
    totalCount: number;
  };
  audit: {
    totalEntries: number;
    recentSummary: string;
    ingestOutcome?: string;
  };
  environment: {
    environment: string;
    profile: string;
    allowMocks: boolean;
  };
  release: {
    version: string;
    readinessStatus: string;
  };
  productionSafety: {
    gateStatus: string;
    blocked: boolean;
    summary: string;
  } | null;
  readinessScore?: number;
  readinessLevel?: string;
}

export function buildOperationalSnapshotFromPlatform(
  input: OperationalSnapshotInput,
): OperationalPlatformSnapshot {
  return {
    runtime: {
      status: input.runtime.status,
      isRunning: input.runtime.isRunning,
      uptimeMs: input.runtime.uptimeMs,
      readyModuleCount: input.runtime.readyModuleCount,
      totalModuleCount: input.runtime.totalModuleCount,
      modules: input.runtime.modules,
    },
    health: input.health,
    dependencies: input.dependencyGraph,
    events: input.events,
    audit: input.audit,
    environment: input.environment,
    release: input.release,
    productionSafety: input.productionSafety,
    readinessScore: input.readinessScore,
    readinessLevel: input.readinessLevel,
  };
}
