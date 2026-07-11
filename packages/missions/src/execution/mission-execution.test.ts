import { describe, expect, it, vi } from "vitest";
import {
  OperationalAgentRuntime,
  SYSTEM_DIAGNOSTICS_AGENT_ID,
  createDeterministicOperationalSnapshot,
} from "@douglas/agents";
import { mapEventToAuditEntries, createAuditMapperState } from "@douglas/audit";
import { createEvent } from "@douglas/events";
import { MissionManager } from "../MissionManager";
import {
  canPerformMissionExecution,
  mapExecutionStatusToMissionStatus,
  MISSION_EXECUTION_VALID_TRANSITIONS,
  MissionExecutionCoordinator,
  MissionExecutionIdempotencyGuard,
  MissionExecutionRegistry,
  OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
} from "./index";

function createCoordinator(overrides?: {
  publishEvent?: MissionExecutionCoordinator["publishEvent"];
  appendAudit?: MissionExecutionCoordinator["appendAudit"];
}) {
  const manager = new MissionManager();
  const events: string[] = [];
  const audit: string[] = [];
  const agentRuntime = new OperationalAgentRuntime();
  const snapshotSource = {
    collect: () => createDeterministicOperationalSnapshot(),
  };

  const coordinator = new MissionExecutionCoordinator({
    manager,
    agentRuntime,
    snapshotSource,
    publishEvent: overrides?.publishEvent ?? ((topic) => events.push(topic)),
    appendAudit:
      overrides?.appendAudit ??
      ((entry) => {
        audit.push(entry.action);
      }),
  });

  return { coordinator, manager, events, audit };
}

function diagnosticRequest(
  coordinator: MissionExecutionCoordinator,
  overrides?: Partial<ReturnType<MissionExecutionCoordinator["createDiagnosticRequest"]>>,
) {
  return coordinator.createDiagnosticRequest({
    executionId: overrides?.executionId ?? `exec-${Math.random().toString(36).slice(2)}`,
    correlationId: overrides?.correlationId ?? `corr-${Math.random().toString(36).slice(2)}`,
    requestId: overrides?.requestId ?? `req-${Math.random().toString(36).slice(2)}`,
    createdBy: overrides?.createdBy ?? "op-1",
    createdByRole: overrides?.createdByRole ?? "operator",
    ...overrides,
  });
}

describe("MissionExecutionCoordinator", () => {
  it("executa fluxo completo com sucesso", async () => {
    const { coordinator, manager, events, audit } = createCoordinator();
    const request = diagnosticRequest(coordinator);

    const result = await coordinator.execute(request, { instant: true });

    expect(result.success).toBe(true);
    expect(result.context.status).toBe("completed");
    expect(result.context.progress).toBe(100);
    expect(result.context.assignedAgentId).toBe(SYSTEM_DIAGNOSTICS_AGENT_ID);
    expect(events).toContain("mission:completed");
    expect(audit.length).toBeGreaterThan(0);

    const mission = manager.get(result.context.missionId);
    expect(mission?.status).toBe("completed");
  });

  it("mapeia status de execução para board sem contradição", async () => {
    expect(mapExecutionStatusToMissionStatus("planned")).toBe("planned");
    expect(mapExecutionStatusToMissionStatus("running")).toBe("active");
    expect(mapExecutionStatusToMissionStatus("failed")).toBe("blocked");
    expect(mapExecutionStatusToMissionStatus("completed")).toBe("completed");
  });

  it("bloqueia transições inválidas", () => {
    expect(MISSION_EXECUTION_VALID_TRANSITIONS.completed).toEqual([]);
    expect(MISSION_EXECUTION_VALID_TRANSITIONS.running).toContain("completed");
    expect(MISSION_EXECUTION_VALID_TRANSITIONS.running).not.toContain("planned");
  });

  it("rejeita duplicidade de executionId após conclusão", async () => {
    const { coordinator } = createCoordinator();
    const request = diagnosticRequest(coordinator, { executionId: "exec-dup-1" });

    const first = await coordinator.execute(request, { instant: true });
    const second = await coordinator.execute(request, { instant: true });

    expect(first.success).toBe(true);
    expect(second.context.executionId).toBe("exec-dup-1");
    expect(second.success).toBe(true);
    expect(second.summary).toBe(first.summary);
  });

  it("rejeita execução concorrente da mesma missão", async () => {
    const manager = new MissionManager();
    const registry = new MissionExecutionRegistry();
    const coordinator = new MissionExecutionCoordinator({
      manager,
      registry,
    });

    const mission = manager.create({
      title: "Test",
      metadata: { missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE },
    });
    manager.transition(mission.id, "planned");

    const runningContext = {
      request: diagnosticRequest(coordinator, { missionId: mission.id }),
      status: "running" as const,
      missionId: mission.id,
      executionId: "exec-running",
      correlationId: "corr-1",
      requestId: "req-1",
      createdBy: "op-1",
      progress: 50,
      attempt: 1,
    };
    registry.register(runningContext);

    const second = await coordinator.execute(
      diagnosticRequest(coordinator, {
        executionId: "exec-new",
        missionId: mission.id,
      }),
      { instant: true },
    );

    expect(second.success).toBe(false);
    expect(second.summary).toContain("já em execução");
  });

  it("permite retry controlado com nova tentativa", async () => {
    const { coordinator } = createCoordinator();
    const first = await coordinator.execute(
      diagnosticRequest(coordinator, { executionId: "exec-attempt-1" }),
      { instant: true },
    );
    expect(first.success).toBe(true);

    const retry = await coordinator.execute(
      {
        ...diagnosticRequest(coordinator, { executionId: "exec-attempt-2" }),
        isRetry: true,
        missionId: first.context.missionId,
        previousExecutionId: first.context.executionId,
      },
      { instant: true },
    );

    expect(retry.success).toBe(true);
    expect(retry.context.attempt).toBe(2);
  });

  it("sanitiza falha de acesso", async () => {
    const { coordinator } = createCoordinator();
    const result = await coordinator.execute(
      diagnosticRequest(coordinator, { createdByRole: "viewer" }),
      { instant: true },
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain("Viewer");
    expect(result.context.sanitizedError).toBeDefined();
  });

  it("mantém progresso entre 0 e 100", async () => {
    const { coordinator } = createCoordinator();
    const progressValues: number[] = [];

    const coordinatorWithProgress = new MissionExecutionCoordinator({
      manager: new MissionManager(),
      publishEvent: () => {},
      appendAudit: () => {},
    });

    const original = coordinatorWithProgress.execute.bind(coordinatorWithProgress);
    vi.spyOn(coordinatorWithProgress, "execute").mockImplementation(async (req, opts) => {
      const result = await original(req, opts);
      progressValues.push(result.context.progress);
      return result;
    });

    await coordinatorWithProgress.execute(diagnosticRequest(coordinator), { instant: true });

    const result = await coordinator.execute(diagnosticRequest(coordinator), { instant: true });
    expect(result.context.progress).toBeGreaterThanOrEqual(0);
    expect(result.context.progress).toBeLessThanOrEqual(100);
  });

  it("produz timeline ordenada", async () => {
    const { coordinator, manager } = createCoordinator();
    const result = await coordinator.execute(diagnosticRequest(coordinator), { instant: true });
    const timeline = manager.getTimeline().getByMissionId(result.context.missionId);

    expect(timeline.length).toBeGreaterThan(0);
    const sorted = [...timeline].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    for (let index = 1; index < sorted.length; index++) {
      expect(sorted[index]!.timestamp >= sorted[index - 1]!.timestamp).toBe(true);
    }
  });

  it("viewer não pode executar", () => {
    expect(
      canPerformMissionExecution({
        role: "viewer",
        missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
        capability: "execute",
      }),
    ).toBe(false);
  });

  it("operator executa missão diagnóstica", () => {
    expect(
      canPerformMissionExecution({
        role: "operator",
        missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
        capability: "execute",
      }),
    ).toBe(true);
  });

  it("eventos audited não geram audit duplicado via mapper", () => {
    const event = createEvent(
      "mission:completed",
      "missions",
      {
        missionId: "m-1",
        executionId: "e-1",
        correlationId: "c-1",
        status: "completed",
        audited: true,
        summary: "ok",
      },
      {},
    );

    const mapped = mapEventToAuditEntries(event, createAuditMapperState());
    expect(mapped.entries).toHaveLength(0);
  });

  it("idempotency guard detecta duplicidade", () => {
    const registry = new MissionExecutionRegistry();
    const guard = new MissionExecutionIdempotencyGuard(registry);

    registry.register({
      request: {} as never,
      status: "completed",
      missionId: "m-1",
      executionId: "e-1",
      correlationId: "c-1",
      requestId: "r-1",
      createdBy: "op",
      progress: 100,
      attempt: 1,
    });

    expect(guard.evaluate({ executionId: "e-1", missionId: "m-1" })).toBe(
      "reject_same_execution",
    );
  });
});
