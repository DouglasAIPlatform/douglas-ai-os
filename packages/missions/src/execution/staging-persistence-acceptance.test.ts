import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AgentExecutionHistoryEntry } from "@douglas/agents";
import {
  StagingPersistenceAcceptanceSuite,
  buildAcceptanceContinuationToken,
  buildMissionExecutionRecoveryPresentation,
  assertAcceptanceTokenSanitized,
  isAcceptanceContinuationExpired,
  validateMultiAgentMetricsIsolation,
  validateRehydratedAgentMetrics,
  assertCompletedExecutionDoesNotRestartAgent,
  STAGING_PERSISTENCE_ACCEPTANCE_SCENARIO_DEFS,
  buildInitialAcceptanceScenarios,
} from "./persistence/acceptance";
import { evaluateMissionPersistenceFallback } from "./persistence/remote";
import { evaluateMissionExecutionRecovery } from "./persistence/MissionExecutionRecoveryPolicy";
import { rehydrateMissionExecutions } from "./persistence/MissionExecutionRehydration";
import {
  OPERATIONAL_DIAGNOSTIC_AGENT_ID,
  OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
  RELEASE_READINESS_AGENT_ID,
  RELEASE_READINESS_REVIEW_MISSION_TYPE,
} from "./MissionExecutionTypes";
import { buildAcceptanceMissionContext } from "./persistence/remote";

const repoRoot = join(fileURLToPath(import.meta.url), "..", "..", "..", "..", "..");

function historyEntry(
  overrides: Partial<AgentExecutionHistoryEntry> & Pick<AgentExecutionHistoryEntry, "agentId" | "executionId">,
): AgentExecutionHistoryEntry {
  return {
    missionId: "m-1",
    missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
    status: "completed",
    outcome: "completed",
    attempt: 1,
    progress: 100,
    correlationId: "corr-1",
    createdAt: new Date().toISOString(),
    dataScope: "combined",
    ...overrides,
  };
}

describe("Staging persistence acceptance (Sprint 5.55)", () => {
  it("suite não executa automaticamente", () => {
    expect(StagingPersistenceAcceptanceSuite.autoRun).toBe(false);
  });

  it("cinco cenários presentes", () => {
    expect(STAGING_PERSISTENCE_ACCEPTANCE_SCENARIO_DEFS).toHaveLength(5);
    expect(buildInitialAcceptanceScenarios()).toHaveLength(5);
  });

  it("botão bloqueado fora de staging", () => {
    const eligibility = StagingPersistenceAcceptanceSuite.evaluateEligibility({
      environment: "development",
      configuredMode: "supabase_preferred",
      health: {
        enabled: true,
        mode: "supabase_preferred",
        activeAdapter: "composite",
        supabaseConfigured: true,
        supabaseTableReady: true,
        fallbackActive: false,
        pendingSyncCount: 0,
        lastSyncAt: null,
        lastError: null,
        lastPersistedAt: null,
        lastHydratedAt: null,
      },
      role: "operator",
      profileActive: true,
      isAuthenticated: true,
      supabaseClient: {} as never,
      createdByUserId: "user-1",
    });
    expect(eligibility.allowed).toBe(false);
  });

  it("viewer bloqueado", () => {
    const eligibility = StagingPersistenceAcceptanceSuite.evaluateEligibility({
      environment: "staging",
      configuredMode: "supabase_required",
      health: {
        enabled: true,
        mode: "supabase_required",
        activeAdapter: "supabase",
        supabaseConfigured: true,
        supabaseTableReady: true,
        fallbackActive: false,
        pendingSyncCount: 0,
        lastSyncAt: null,
        lastError: null,
        lastPersistedAt: null,
        lastHydratedAt: null,
      },
      role: "viewer",
      profileActive: true,
      isAuthenticated: true,
      supabaseClient: {} as never,
      createdByUserId: "user-1",
    });
    expect(eligibility.allowed).toBe(false);
  });

  it("token sem dados sensíveis", () => {
    const token = buildAcceptanceContinuationToken({
      suiteRunId: "run-1",
      scenarioId: "system_diagnostics",
      stepIndex: 3,
      executionIds: ["acceptance:operational_diagnostic:123"],
    });
    expect(assertAcceptanceTokenSanitized(token)).toBe(true);
    expect(JSON.stringify(token)).not.toMatch(/@/);
    expect(JSON.stringify(token)).not.toMatch(/eyJ/);
  });

  it("token expira", () => {
    const token = buildAcceptanceContinuationToken({
      suiteRunId: "run-1",
      scenarioId: "recovery",
      stepIndex: 0,
      ttlMs: -1000,
    });
    expect(isAcceptanceContinuationExpired(token)).toBe(true);
  });

  it("running vira interrupted via recovery policy", () => {
    const decision = evaluateMissionExecutionRecovery("running");
    expect(decision.nextStatus).toBe("interrupted");
    expect(decision.action).toBe("mark_interrupted");
  });

  it("recovery presentation não permite auto-continue", () => {
    const presentation = buildMissionExecutionRecoveryPresentation("running");
    expect(presentation.autoContinueAllowed).toBe(false);
    expect(presentation.recommendedAction).toContain("manual");
  });

  it("completed não reinicia agente", () => {
    const result = assertCompletedExecutionDoesNotRestartAgent({
      executionStatus: "completed",
      agentExecuteCountBefore: 1,
      agentExecuteCountAfter: 1,
    });
    expect(result.valid).toBe(true);
  });

  it("isolation entre agentes", () => {
    const entries = [
      historyEntry({ agentId: OPERATIONAL_DIAGNOSTIC_AGENT_ID, executionId: "e1" }),
      historyEntry({
        agentId: RELEASE_READINESS_AGENT_ID,
        executionId: "e2",
        missionType: RELEASE_READINESS_REVIEW_MISSION_TYPE,
      }),
    ];
    const diagnosticsMetrics = {
      agentId: OPERATIONAL_DIAGNOSTIC_AGENT_ID,
      totalExecutions: 1,
      completed: 1,
      failed: 0,
      cancelled: 0,
      interrupted: 0,
      successRate: 1,
      averageDurationMs: null,
      lastDurationMs: null,
      lastExecutionAt: entries[0].createdAt,
      lastOutcome: "completed" as const,
      activeExecutions: 0,
      missionTypesExecuted: [OPERATIONAL_DIAGNOSTIC_MISSION_TYPE],
      sampleSize: 1,
      insufficientSample: false,
      dataScope: "combined" as const,
    };
    const releaseMetrics = {
      ...diagnosticsMetrics,
      agentId: RELEASE_READINESS_AGENT_ID,
      missionTypesExecuted: [RELEASE_READINESS_REVIEW_MISSION_TYPE],
    };
    const isolation = validateMultiAgentMetricsIsolation({
      diagnosticsAgentId: OPERATIONAL_DIAGNOSTIC_AGENT_ID,
      releaseAgentId: RELEASE_READINESS_AGENT_ID,
      entries,
      diagnosticsMetrics,
      releaseMetrics,
    });
    expect(isolation.valid).toBe(true);
  });

  it("history deduplicado no combined", () => {
    const entries = [
      historyEntry({ agentId: OPERATIONAL_DIAGNOSTIC_AGENT_ID, executionId: "dup" }),
      historyEntry({ agentId: OPERATIONAL_DIAGNOSTIC_AGENT_ID, executionId: "dup" }),
    ];
    const validation = validateRehydratedAgentMetrics({
      agentId: OPERATIONAL_DIAGNOSTIC_AGENT_ID,
      entries,
      scope: "combined",
      dataSource: "composite",
    });
    expect(validation.metrics.totalExecutions).toBe(1);
  });

  it("fallback bloqueia acceptance em staging", async () => {
    const suite = new StagingPersistenceAcceptanceSuite();
    const { report } = await suite.runSafeAcceptance({
      environment: "staging",
      configuredMode: "supabase_required",
      health: {
        enabled: true,
        mode: "supabase_required",
        activeAdapter: "session",
        supabaseConfigured: true,
        supabaseTableReady: false,
        fallbackActive: true,
        pendingSyncCount: 2,
        lastSyncAt: null,
        lastError: "fallback",
        lastPersistedAt: null,
        lastHydratedAt: null,
      },
      role: "operator",
      profileActive: true,
      isAuthenticated: true,
      operatorLabel: "operator",
      createdByUserId: "user-1",
      supabaseClient: { from: vi.fn() } as never,
      listRecentExecutions: async () => [],
      listExecutionEvents: async () => [],
      saveExecution: async () => ({ success: true }),
      historyEntries: [],
    });
    expect(report.status).toBe("blocked");
    expect(report.scenarios.find((s) => s.id === "fallback_detection")?.status).toBe("blocked");
  });

  it("métricas memory-only não provam persistência remota", () => {
    const validation = validateRehydratedAgentMetrics({
      agentId: OPERATIONAL_DIAGNOSTIC_AGENT_ID,
      entries: [historyEntry({ agentId: OPERATIONAL_DIAGNOSTIC_AGENT_ID, executionId: "e1" })],
      scope: "session",
      dataSource: "memory",
      requirePersistedProof: true,
    });
    expect(validation.valid).toBe(false);
    expect(validation.persistedProof).toBe(false);
  });

  it("rehydrate aplica recovery para running", async () => {
    const context = buildAcceptanceMissionContext({
      missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
      createdBy: "op",
      createdByUserId: "user-1",
      createdByRole: "operator",
    });
    context.status = "running";
    const result = await rehydrateMissionExecutions({
      listRecentExecutions: async () => [context],
      listExecutionEvents: async () => [],
    });
    expect(result.recoveryDecisions[0]?.nextStatus).toBe("interrupted");
    expect(result.executions[0]?.status).toBe("interrupted");
  });

  it("approval de production não é executada no cenário release", () => {
    const widget = readFileSync(
      join(repoRoot, "apps/headquarters/components/widgets/MissionExecutionWidget.tsx"),
      "utf8",
    );
    expect(widget).toContain("Staging Persistence Acceptance");
    const suite = readFileSync(
      join(
        repoRoot,
        "packages/missions/src/execution/persistence/acceptance/StagingPersistenceAcceptanceSuite.ts",
      ),
      "utf8",
    );
    expect(suite).toContain("release:approve_production não executado");
  });

  it("fallback policy staging blocker", () => {
    const evalResult = evaluateMissionPersistenceFallback({
      environment: "staging",
      configuredMode: "supabase_required",
      effectiveMode: "session_only",
      fallbackActive: true,
      pendingSyncCount: 1,
      remotePersistConfirmed: false,
    });
    expect(evalResult.stagingBlocker).toBe(true);
  });

  it("nenhum service_role no frontend acceptance", () => {
    const hook = readFileSync(
      join(repoRoot, "apps/headquarters/features/mission-control/useStagingPersistenceAcceptance.ts"),
      "utf8",
    );
    expect(hook).not.toMatch(/service_role/i);
  });

  it("widget acceptance somente staging", () => {
    const widget = readFileSync(
      join(repoRoot, "apps/headquarters/components/widgets/MissionExecutionWidget.tsx"),
      "utf8",
    );
    expect(widget).toContain("Acceptance staging habilitada apenas em staging");
  });

  it("audit exactly-once — lifecycle audited, progress não", async () => {
    const { shouldAuditMissionTopic } = await import("./MissionExecutionAuditPolicy");
    expect(shouldAuditMissionTopic("mission:completed")).toBe(true);
    expect(shouldAuditMissionTopic("mission:progress")).toBe(false);
    expect(shouldAuditMissionTopic("mission:persistence_rehydrated")).toBe(false);
    const hook = readFileSync(
      join(repoRoot, "apps/headquarters/features/mission-control/useStagingPersistenceAcceptance.ts"),
      "utf8",
    );
    expect(hook).toContain("mission:persistence_acceptance_started");
    expect(hook).toContain("mission:persistence_acceptance_passed");
    expect(hook).toContain("mission:persistence_acceptance_failed");
    expect(hook).toContain('audited: true');
  });

  it("timeline sem transições no-op a partir de completed", async () => {
    const { MISSION_EXECUTION_VALID_TRANSITIONS } = await import("./MissionExecutionCoordinator");
    expect(MISSION_EXECUTION_VALID_TRANSITIONS.completed).toEqual([]);
    expect(MISSION_EXECUTION_VALID_TRANSITIONS.interrupted).toEqual([]);
    expect(MISSION_EXECUTION_VALID_TRANSITIONS.recovery_required).toEqual([]);
  });

  it("cenário diagnostics e release passam com persistência mock", async () => {
    const store = new Map<string, ReturnType<typeof buildAcceptanceMissionContext>>();
    const suite = new StagingPersistenceAcceptanceSuite();
    const diagnosticsEntry = historyEntry({
      agentId: OPERATIONAL_DIAGNOSTIC_AGENT_ID,
      executionId: "acceptance:operational_diagnostic:diag",
      dataScope: "persisted",
    });
    const releaseEntry = historyEntry({
      agentId: RELEASE_READINESS_AGENT_ID,
      executionId: "acceptance:release_readiness_review:rel",
      missionType: RELEASE_READINESS_REVIEW_MISSION_TYPE,
      dataScope: "persisted",
    });

    const { report } = await suite.runSafeAcceptance({
      environment: "staging",
      configuredMode: "supabase_required",
      health: {
        enabled: true,
        mode: "supabase_required",
        activeAdapter: "supabase",
        supabaseConfigured: true,
        supabaseTableReady: true,
        fallbackActive: false,
        pendingSyncCount: 0,
        lastSyncAt: new Date().toISOString(),
        lastError: null,
        lastPersistedAt: new Date().toISOString(),
        lastHydratedAt: null,
      },
      role: "operator",
      profileActive: true,
      isAuthenticated: true,
      operatorLabel: "operator",
      createdByUserId: "user-1",
      supabaseClient: { from: vi.fn() } as never,
      listRecentExecutions: async () => Array.from(store.values()),
      listExecutionEvents: async () => [],
      saveExecution: async (context) => {
        store.set(context.executionId, { ...context });
        return { success: true };
      },
      historyEntries: [diagnosticsEntry, releaseEntry],
      agentExecuteCounts: {
        [OPERATIONAL_DIAGNOSTIC_AGENT_ID]: 1,
        [RELEASE_READINESS_AGENT_ID]: 1,
      },
      resumeExplicit: true,
    });

    expect(report.scenarios.find((s) => s.id === "system_diagnostics")?.status).not.toBe("failed");
    expect(report.scenarios.find((s) => s.id === "release_readiness")?.status).toBe("passed");
    expect(report.scenarios.find((s) => s.id === "recovery")?.status).toBe("passed");
    expect(report.scenarios.find((s) => s.id === "multi_agent_isolation")?.status).toBe("passed");
    expect(report.scenarios.find((s) => s.id === "fallback_detection")?.status).toBe("passed");
  });
});
