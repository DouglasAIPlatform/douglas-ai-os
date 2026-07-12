import { describe, expect, it } from "vitest";
import {
  SYSTEM_DIAGNOSTICS_AGENT_ID,
  calculateAgentExecutionMetrics,
  buildAgentExecutionMetricsSnapshot,
} from "@douglas/agents";
import type { MissionExecutionContext } from "../MissionExecutionTypes";
import { OPERATIONAL_DIAGNOSTIC_MISSION_TYPE } from "../MissionExecutionTypes";
import {
  abbreviateAgentCorrelationId,
  dedupeHistoryEntries,
  missionContextToHistoryEntry,
  sanitizeHistoryDisplayText,
  sortHistoryNewestFirst,
} from "./AgentExecutionHistoryMapper";
import {
  CompositeAgentExecutionHistoryRepository,
  InMemoryAgentExecutionHistoryRepository,
  SessionAgentExecutionHistoryRepository,
  createCompositeAgentExecutionHistoryRepository,
} from "./AgentExecutionHistoryRepositoryImpl";

const OTHER_AGENT_ID = "other-agent";

function buildContext(
  overrides: Partial<MissionExecutionContext> = {},
): MissionExecutionContext {
  const startedAt = overrides.startedAt ?? "2026-07-01T10:00:00.000Z";
  return {
    request: {
      executionId: "exec-1",
      correlationId: "corr-abc123456789",
      requestId: "req-1",
      createdBy: "op-1",
      createdByRole: "operator",
      missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
      title: "Diagnóstico",
      createdByUserId: "user-1",
    },
    status: "completed",
    missionId: "mission-1",
    executionId: "exec-1",
    correlationId: "corr-abc123456789",
    requestId: "req-1",
    createdBy: "op-1",
    createdByUserId: "user-1",
    assignedAgentId: SYSTEM_DIAGNOSTICS_AGENT_ID,
    progress: 100,
    attempt: 1,
    startedAt,
    completedAt: "2026-07-01T10:00:05.000Z",
    resultSummary: "Diagnóstico concluído",
    ...overrides,
  };
}

describe("Agent execution history (Sprint 5.51)", () => {
  it("métricas sem execuções não reportam 100% de sucesso", () => {
    const metrics = calculateAgentExecutionMetrics({
      agentId: SYSTEM_DIAGNOSTICS_AGENT_ID,
      entries: [],
      scope: "combined",
    });

    expect(metrics.totalExecutions).toBe(0);
    expect(metrics.successRate).toBeNull();
    expect(metrics.insufficientSample).toBe(true);
    expect(metrics.averageDurationMs).toBeNull();
  });

  it("calcula métricas para uma execução concluída", () => {
    const entry = missionContextToHistoryEntry(buildContext(), "combined");
    const snapshot = buildAgentExecutionMetricsSnapshot({
      agentId: SYSTEM_DIAGNOSTICS_AGENT_ID,
      entries: [entry],
      scope: "combined",
      dataSource: "session",
    });

    expect(snapshot.metrics.completed).toBe(1);
    expect(snapshot.metrics.successRate).toBe(1);
    expect(snapshot.metrics.averageDurationMs).toBe(5000);
    expect(snapshot.metrics.lastOutcome).toBe("completed");
  });

  it("agrega completed, failed e cancelled", () => {
    const entries = [
      missionContextToHistoryEntry(buildContext({ executionId: "e1", status: "completed" }), "combined"),
      missionContextToHistoryEntry(
        buildContext({
          executionId: "e2",
          status: "failed",
          sanitizedError: "Falha simulada",
          resultSummary: undefined,
        }),
        "combined",
      ),
      missionContextToHistoryEntry(
        buildContext({ executionId: "e3", status: "cancelled", missionId: "m3" }),
        "combined",
      ),
    ];

    const metrics = calculateAgentExecutionMetrics({
      agentId: SYSTEM_DIAGNOSTICS_AGENT_ID,
      entries,
      scope: "combined",
    });

    expect(metrics.completed).toBe(1);
    expect(metrics.failed).toBe(1);
    expect(metrics.cancelled).toBe(1);
    expect(metrics.successRate).toBeCloseTo(1 / 3);
  });

  it("calcula duração média apenas de execuções terminais", () => {
    const entries = [
      missionContextToHistoryEntry(
        buildContext({
          executionId: "e1",
          startedAt: "2026-07-01T10:00:00.000Z",
          completedAt: "2026-07-01T10:00:02.000Z",
        }),
        "combined",
      ),
      missionContextToHistoryEntry(
        buildContext({
          executionId: "e2",
          startedAt: "2026-07-01T11:00:00.000Z",
          completedAt: "2026-07-01T11:00:06.000Z",
        }),
        "combined",
      ),
    ];

    const metrics = calculateAgentExecutionMetrics({
      agentId: SYSTEM_DIAGNOSTICS_AGENT_ID,
      entries,
      scope: "combined",
    });

    expect(metrics.averageDurationMs).toBe(4000);
  });

  it("ordena histórico do mais recente ao mais antigo", () => {
    const entries = [
      missionContextToHistoryEntry(
        buildContext({ executionId: "old", startedAt: "2026-07-01T08:00:00.000Z" }),
        "session",
      ),
      missionContextToHistoryEntry(
        buildContext({ executionId: "new", startedAt: "2026-07-01T12:00:00.000Z" }),
        "session",
      ),
    ];

    const sorted = sortHistoryNewestFirst(entries);
    expect(sorted[0]?.executionId).toBe("new");
    expect(sorted[1]?.executionId).toBe("old");
  });

  it("pagina resultados com limite", async () => {
    const repo = new InMemoryAgentExecutionHistoryRepository();
    repo.seedFromContexts(
      Array.from({ length: 15 }, (_, index) =>
        buildContext({
          executionId: `exec-${index}`,
          missionId: `mission-${index}`,
          startedAt: `2026-07-01T${String(10 + index).padStart(2, "0")}:00:00.000Z`,
        }),
      ),
    );

    const page1 = await repo.paginate({
      agentId: SYSTEM_DIAGNOSTICS_AGENT_ID,
      limit: 10,
      offset: 0,
    });
    const page2 = await repo.paginate({
      agentId: SYSTEM_DIAGNOSTICS_AGENT_ID,
      limit: 10,
      offset: 10,
    });

    expect(page1.entries).toHaveLength(10);
    expect(page1.hasMore).toBe(true);
    expect(page2.entries).toHaveLength(5);
    expect(page2.hasMore).toBe(false);
  });

  it("isola histórico por agente", async () => {
    const repo = new SessionAgentExecutionHistoryRepository(() => [
      buildContext({ assignedAgentId: SYSTEM_DIAGNOSTICS_AGENT_ID, executionId: "a1" }),
      buildContext({ assignedAgentId: OTHER_AGENT_ID, executionId: "b1", missionId: "m2" }),
    ]);

    const diagnosticsPage = await repo.listByAgent({
      agentId: SYSTEM_DIAGNOSTICS_AGENT_ID,
    });
    const otherPage = await repo.listByAgent({ agentId: OTHER_AGENT_ID });

    expect(diagnosticsPage.entries).toHaveLength(1);
    expect(diagnosticsPage.entries[0]?.agentId).toBe(SYSTEM_DIAGNOSTICS_AGENT_ID);
    expect(otherPage.entries).toHaveLength(1);
    expect(otherPage.entries[0]?.agentId).toBe(OTHER_AGENT_ID);
  });

  it("scope session vs persisted vs combined", async () => {
    const sessionContexts = [
      buildContext({ executionId: "session-only", missionId: "ms1" }),
    ];
    const persistedContexts = [
      buildContext({
        executionId: "persisted-only",
        missionId: "mp1",
        startedAt: "2026-07-02T10:00:00.000Z",
      }),
    ];

    const repo = createCompositeAgentExecutionHistoryRepository({
      listSessionContexts: () => sessionContexts,
      listByAgent: async (agentId, limit, offset) =>
        persistedContexts
          .filter((ctx) => ctx.assignedAgentId === agentId)
          .slice(offset, offset + limit),
      listRecent: async (limit) => persistedContexts.slice(0, limit),
      dataSource: "supabase",
    });

    const sessionPage = await repo.paginate({
      agentId: SYSTEM_DIAGNOSTICS_AGENT_ID,
      scope: "session",
    });
    const persistedPage = await repo.paginate({
      agentId: SYSTEM_DIAGNOSTICS_AGENT_ID,
      scope: "persisted",
    });
    const combinedPage = await repo.paginate({
      agentId: SYSTEM_DIAGNOSTICS_AGENT_ID,
      scope: "combined",
    });

    expect(sessionPage.entries.map((e) => e.executionId)).toEqual(["session-only"]);
    expect(persistedPage.entries.map((e) => e.executionId)).toEqual(["persisted-only"]);
    expect(combinedPage.entries.map((e) => e.executionId)).toEqual([
      "persisted-only",
      "session-only",
    ]);
  });

  it("fallback para sessão quando persistência remota vazia", async () => {
    const sessionContexts = [buildContext({ executionId: "fallback-exec" })];

    const repo = createCompositeAgentExecutionHistoryRepository({
      listSessionContexts: () => sessionContexts,
      listByAgent: async () => [],
      listRecent: async () => [],
    });

    const metrics = await repo.getAgentMetrics(SYSTEM_DIAGNOSTICS_AGENT_ID, "combined");
    expect(metrics.metrics.totalExecutions).toBe(1);
    expect(metrics.dataSource).toBe("session");
  });

  it("não exibe e-mail ou token em textos sanitizados", () => {
    const sanitized = sanitizeHistoryDisplayText(
      "Erro user@secret.com token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc.def",
    );
    expect(sanitized).not.toContain("@secret.com");
    expect(sanitized).not.toContain("eyJ");
  });

  it("abrevia correlationId sem expor valor completo", () => {
    const abbreviated = abbreviateAgentCorrelationId("corr-abc12345678901234567890");
    expect(abbreviated.length).toBeLessThan(30);
    expect(abbreviated).toContain("…");
  });

  it("reload preserva histórico via reidratação sem duplicatas", async () => {
    const contexts = [
      buildContext({ executionId: "dup", startedAt: "2026-07-01T10:00:00.000Z" }),
      buildContext({ executionId: "dup", startedAt: "2026-07-01T10:00:00.000Z" }),
      buildContext({ executionId: "unique", startedAt: "2026-07-01T11:00:00.000Z" }),
    ];

    const sessionRepo = new SessionAgentExecutionHistoryRepository(() => contexts);
    const persistedRepo = createCompositeAgentExecutionHistoryRepository({
      listSessionContexts: () => contexts,
      listByAgent: async () => contexts,
      listRecent: async () => contexts,
    });

    const sessionEntries = await sessionRepo.listRecent(SYSTEM_DIAGNOSTICS_AGENT_ID);
    const combinedEntries = await persistedRepo.listRecent(
      SYSTEM_DIAGNOSTICS_AGENT_ID,
      10,
      "combined",
    );

    const deduped = dedupeHistoryEntries([...sessionEntries, ...combinedEntries]);
    expect(deduped).toHaveLength(2);
    expect(deduped.map((e) => e.executionId).sort()).toEqual(["dup", "unique"]);
  });

  it("CompositeAgentExecutionHistoryRepository deduplica entre fontes", async () => {
    const shared = buildContext({ executionId: "shared-exec" });
    const repo = new CompositeAgentExecutionHistoryRepository(
      new SessionAgentExecutionHistoryRepository(() => [shared]),
      null,
    );

    const page = await repo.paginate({
      agentId: SYSTEM_DIAGNOSTICS_AGENT_ID,
      scope: "session",
    });
    expect(page.entries).toHaveLength(1);
  });
});
