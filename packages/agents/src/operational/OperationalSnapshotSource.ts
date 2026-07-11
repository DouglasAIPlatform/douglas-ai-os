/** Snapshots sanitizados consumidos pelo System Diagnostics Agent — read-only. */
export interface RuntimeModuleSnapshotRef {
  id: string;
  name: string;
  status: string;
  health: string;
}

export interface RuntimeSnapshotRef {
  status: string;
  isRunning: boolean;
  uptimeMs: number;
  readyModuleCount: number;
  totalModuleCount: number;
  modules: RuntimeModuleSnapshotRef[];
}

export interface HealthModuleSnapshotRef {
  moduleId: string;
  moduleName: string;
  status: string;
  message?: string;
}

export interface HealthSnapshotRef {
  status: string;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  offlineCount: number;
  modules: HealthModuleSnapshotRef[];
}

export interface DependencyIssueRef {
  type: string;
  message: string;
  severity: string;
  moduleId?: string;
}

export interface DependencySnapshotRef {
  status: string;
  issueCount: number;
  circularDependencyCount: number;
  criticalUnavailableCount: number;
  issues: DependencyIssueRef[];
}

export interface EventMonitorSnapshotRef {
  events: Array<{
    id: string;
    source: string;
    type: string;
    severity: string;
    message: string;
    timestamp: string;
  }>;
  totalCount: number;
}

export interface AuditSnapshotRef {
  totalEntries: number;
  recentSummary: string;
  ingestOutcome?: string;
}

export interface EnvironmentSnapshotRef {
  environment: string;
  profile: string;
  allowMocks: boolean;
}

export interface ReleaseSnapshotRef {
  version: string;
  readinessStatus: string;
}

export interface ProductionSafetySnapshotRef {
  gateStatus: string;
  blocked: boolean;
  summary: string;
}

export interface OperationalPlatformSnapshot {
  runtime: RuntimeSnapshotRef | null;
  health: HealthSnapshotRef | null;
  dependencies: DependencySnapshotRef | null;
  events: EventMonitorSnapshotRef | null;
  audit: AuditSnapshotRef | null;
  environment: EnvironmentSnapshotRef | null;
  release: ReleaseSnapshotRef | null;
  productionSafety: ProductionSafetySnapshotRef | null;
  readinessScore?: number;
  readinessLevel?: string;
}

export interface OperationalSnapshotSource {
  collect(): OperationalPlatformSnapshot | Promise<OperationalPlatformSnapshot>;
}

export function createEmptyOperationalSnapshot(): OperationalPlatformSnapshot {
  return {
    runtime: null,
    health: null,
    dependencies: null,
    events: null,
    audit: null,
    environment: null,
    release: null,
    productionSafety: null,
  };
}

export function createDeterministicOperationalSnapshot(
  overrides: Partial<OperationalPlatformSnapshot> = {},
): OperationalPlatformSnapshot {
  return {
    runtime: {
      status: "running",
      isRunning: true,
      uptimeMs: 120_000,
      readyModuleCount: 8,
      totalModuleCount: 8,
      modules: [
        { id: "core", name: "Core", status: "ready", health: "healthy" },
        { id: "runtime", name: "Runtime", status: "ready", health: "healthy" },
        { id: "health", name: "Health", status: "ready", health: "healthy" },
      ],
    },
    health: {
      status: "healthy",
      healthyCount: 8,
      warningCount: 0,
      criticalCount: 0,
      offlineCount: 0,
      modules: [
        { moduleId: "core", moduleName: "Core", status: "healthy" },
        { moduleId: "runtime", moduleName: "Runtime", status: "healthy" },
      ],
    },
    dependencies: {
      status: "healthy",
      issueCount: 0,
      circularDependencyCount: 0,
      criticalUnavailableCount: 0,
      issues: [],
    },
    events: {
      totalCount: 3,
      events: [
        {
          id: "evt-1",
          source: "missions",
          type: "mission:completed",
          severity: "info",
          message: "Missão concluída",
          timestamp: new Date().toISOString(),
        },
      ],
    },
    audit: {
      totalEntries: 5,
      recentSummary: "Audit operacional ativo",
      ingestOutcome: "accepted",
    },
    environment: {
      environment: "development",
      profile: "development",
      allowMocks: true,
    },
    release: {
      version: "0.1.0",
      readinessStatus: "ready",
    },
    productionSafety: {
      gateStatus: "open",
      blocked: false,
      summary: "Gate operacional disponível",
    },
    readinessScore: 92,
    readinessLevel: "ready",
    ...overrides,
  };
}
