import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CompositeMissionExecutionPersistence,
  SupabaseMissionExecutionPersistence,
  evaluateMissionExecutionRecovery,
  missionExecutionContextToRow,
  missionExecutionRowToContext,
  rehydrateMissionExecutions,
  sanitizeMissionPersistenceText,
  type MissionExecutionContext,
} from "./persistence";
import { OPERATIONAL_DIAGNOSTIC_MISSION_TYPE } from "./MissionExecutionTypes";

function buildContext(overrides: Partial<MissionExecutionContext> = {}): MissionExecutionContext {
  return {
    request: {
      executionId: "exec-1",
      correlationId: "corr-1",
      requestId: "req-1",
      createdBy: "op-1",
      createdByRole: "operator",
      missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
      title: "Diagnóstico",
      createdByUserId: "user-1",
    },
    status: "running",
    missionId: "mission-1",
    executionId: "exec-1",
    correlationId: "corr-1",
    requestId: "req-1",
    createdBy: "op-1",
    createdByUserId: "user-1",
    progress: 40,
    attempt: 1,
    ...overrides,
  };
}

function createMockSupabaseClient(handlers: {
  executions?: Record<string, unknown>[];
  events?: Record<string, unknown>[];
  insertError?: string;
  upsertError?: string;
}) {
  const executions = [...(handlers.executions ?? [])];
  const events = [...(handlers.events ?? [])];

  const from = vi.fn((table: string) => {
    const api = {
      select: vi.fn(() => api),
      eq: vi.fn(() => api),
      order: vi.fn(() => api),
      limit: vi.fn(async () => {
        if (table.includes("events")) {
          return { data: events, error: null };
        }
        return { data: executions, error: null };
      }),
      maybeSingle: vi.fn(async () => ({
        data: executions[0] ?? null,
        error: null,
      })),
      upsert: vi.fn(async () => ({
        error: handlers.upsertError ? { message: handlers.upsertError } : null,
      })),
      insert: vi.fn(async () => ({
        error: handlers.insertError ? { message: handlers.insertError } : null,
      })),
    };
    return api;
  });

  return { from } as unknown as SupabaseClient;
}

describe("Mission execution persistence (Sprint 5.50)", () => {
  it("sanitiza e-mail e tokens antes de persistir", () => {
    const sanitized = sanitizeMissionPersistenceText(
      "Falha user@test.com token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc.def",
    );
    expect(sanitized).not.toContain("@test.com");
    expect(sanitized).not.toContain("eyJ");
  });

  it("mapeia contexto para row e de volta sem campos sensíveis", () => {
    const context = buildContext({
      resultSummary: "Diagnóstico concluído",
    });
    const row = missionExecutionContextToRow(context, { createdByUserId: "user-1" });
    expect(row.execution_id).toBe("exec-1");
    expect(row.progress).toBe(40);
    const restored = missionExecutionRowToContext({
      ...row,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    expect(restored.executionId).toBe("exec-1");
    expect(restored.resultSummary).toBe("Diagnóstico concluído");
  });

  it("salva execução via adapter Supabase mockado", async () => {
    const client = createMockSupabaseClient({});
    const adapter = new SupabaseMissionExecutionPersistence(client);
    await adapter.checkHealth();

    const result = await adapter.saveExecution(buildContext(), {
      createdByUserId: "user-1",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita execution_id duplicado", async () => {
    const client = createMockSupabaseClient({
      upsertError: "duplicate key value violates unique constraint execution_id",
    });
    const adapter = new SupabaseMissionExecutionPersistence(client);
    await adapter.checkHealth();

    const result = await adapter.saveExecution(buildContext(), {
      createdByUserId: "user-1",
    });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("duplicate_execution");
  });

  it("rejeita evento duplicado", async () => {
    const client = createMockSupabaseClient({
      insertError: "duplicate key value violates unique constraint mission_execution_events_execution_sequence_unique",
    });
    const adapter = new SupabaseMissionExecutionPersistence(client);
    await adapter.checkHealth();

    const result = await adapter.appendEvent({
      executionId: "exec-1",
      sequence: 1,
      eventType: "status:running",
      recordedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("duplicate_event");
  });

  it("fallback sessionStorage quando tabela ausente", async () => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    });

    const client = createMockSupabaseClient({});
    const from = client.from as ReturnType<typeof vi.fn>;
    from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      limit: vi.fn(async () => ({
        error: { message: "Could not find the table public.mission_executions in schema cache" },
      })),
    }));

    const composite = new CompositeMissionExecutionPersistence(client, {
      mode: "supabase_preferred",
      isSupabaseConfigured: true,
      sessionStorageKey: "test-session-key",
      defaultWriteMeta: { createdByUserId: "user-1" },
    });

    await composite.initialize();
    composite.save(buildContext({ executionId: "exec-fallback" }));

    const status = composite.getStatus();
    expect(status.fallbackActive).toBe(true);

    const loaded = await composite.load("exec-fallback");
    expect(loaded?.executionId).toBe("exec-fallback");

    vi.unstubAllGlobals();
  });

  it("reidrata execuções e marca running como interrupted", async () => {
    const running = buildContext({ status: "running" });
    const completed = buildContext({
      executionId: "exec-2",
      status: "completed",
      progress: 100,
      resultSummary: "ok",
    });

    const result = await rehydrateMissionExecutions({
      listRecentExecutions: async () => [running, completed],
      listExecutionEvents: async () => [
        {
          executionId: "exec-1",
          sequence: 1,
          eventType: "status:running",
          recordedAt: new Date().toISOString(),
        },
      ],
    });

    expect(result.rehydratedCount).toBe(2);
    expect(result.latestExecution?.status).toBe("interrupted");
    expect(result.recoveryDecisions[0]?.action).toBe("mark_interrupted");
  });

  it("running antigo não reinicia agente — recovery policy retorna interrupted", () => {
    const decision = evaluateMissionExecutionRecovery("running");
    expect(decision.action).toBe("mark_interrupted");
    expect(decision.nextStatus).toBe("interrupted");
  });

  it("viewer bloqueado em canPerformMissionExecution para escrita", async () => {
    const { canPerformMissionExecution } = await import("./MissionExecutionAccessPolicy");
    expect(
      canPerformMissionExecution({
        role: "viewer",
        missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
        capability: "execute",
      }),
    ).toBe(false);
  });

  it("profile inativo bloqueado em verificação estática de migration", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "../../../..");
    const migration = readFileSync(
      join(repoRoot, "supabase/migrations/20250710210000_mission_executions.sql"),
      "utf8",
    );
    expect(migration).toContain("require_active_operator()");
    expect(migration).toContain("mission_executions_deny_anon");
    expect(migration).not.toMatch(/USING\s*\(\s*true\s*\)/i);
    expect(migration).not.toMatch(/WITH CHECK\s*\(\s*true\s*\)/i);
  });

  it("eventos de persistência não entram no audit lifecycle", async () => {
    const { shouldAuditMissionTopic } = await import("./MissionExecutionAuditPolicy");
    expect(shouldAuditMissionTopic("mission:persistence_saved")).toBe(false);
    expect(shouldAuditMissionTopic("mission:persistence_rehydrated")).toBe(false);
  });
});
