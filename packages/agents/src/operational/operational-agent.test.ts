import { describe, expect, it, vi } from "vitest";
import {
  AgentCapabilityMatcher,
  OperationalAgentRegistry,
  OperationalAgentRuntime,
  SYSTEM_DIAGNOSTICS_AGENT_ID,
  SYSTEM_DIAGNOSTICS_AGENT_MANIFEST,
  createDeterministicOperationalSnapshot,
  validateAgentCapabilitiesSafe,
} from "./index";
import { createSystemDiagnosticsAgent } from "./SystemDiagnosticsAgent";

describe("Operational Agent Runtime", () => {
  it("registra System Diagnostics Agent", () => {
    const registry = new OperationalAgentRegistry();
    expect(registry.get(SYSTEM_DIAGNOSTICS_AGENT_ID)?.name).toBe(
      "System Diagnostics Agent",
    );
  });

  it("manifest possui versão e capabilities seguras", () => {
    const { safe, violations } = validateAgentCapabilitiesSafe(
      SYSTEM_DIAGNOSTICS_AGENT_MANIFEST.capabilities,
    );
    expect(safe).toBe(true);
    expect(violations).toHaveLength(0);
    expect(SYSTEM_DIAGNOSTICS_AGENT_MANIFEST.version).toBe("1.0.0");
    expect(SYSTEM_DIAGNOSTICS_AGENT_MANIFEST.readOnly).toBe(true);
  });

  it("capability matching atribui missão compatível", () => {
    const registry = new OperationalAgentRegistry();
    const matcher = new AgentCapabilityMatcher(registry.list(), (id) =>
      registry.getStatus(id),
    );

    const result = matcher.match({
      missionType: "operational_diagnostic",
      requiredCapabilities: ["platform:diagnostics"],
    });

    expect(result.decision).toBe("assigned");
    expect(result.agentId).toBe(SYSTEM_DIAGNOSTICS_AGENT_ID);
  });

  it("rejeita missão incompatível", () => {
    const registry = new OperationalAgentRegistry();
    const matcher = new AgentCapabilityMatcher(registry.list(), (id) =>
      registry.getStatus(id),
    );

    const result = matcher.match({
      missionType: "unknown_mission",
      requiredCapabilities: ["platform:diagnostics"],
    });

    expect(result.decision).toBe("rejected_incompatible");
  });

  it("rejeita agente indisponível quando ocupado", () => {
    const registry = new OperationalAgentRegistry();
    registry.setStatus(SYSTEM_DIAGNOSTICS_AGENT_ID, "running");

    const matcher = new AgentCapabilityMatcher(registry.list(), (id) =>
      registry.getStatus(id),
    );

    const result = matcher.match({
      missionType: "operational_diagnostic",
      requiredCapabilities: ["platform:diagnostics"],
    });

    expect(result.decision).toBe("rejected_busy");
  });

  it("executa diagnóstico com sucesso e relatório sanitizado", async () => {
    const runtime = new OperationalAgentRuntime();
    const snapshotSource = {
      collect: () => createDeterministicOperationalSnapshot(),
    };

    const result = await runtime.execute(
      {
        agentId: SYSTEM_DIAGNOSTICS_AGENT_ID,
        executionId: "exec-agent-1",
        correlationId: "corr-agent-1",
        requestId: "req-agent-1",
        missionId: "mission-1",
        missionType: "operational_diagnostic",
        createdBy: "op-1",
      },
      snapshotSource,
      { instant: true },
    );

    expect(result.success).toBe(true);
    expect(result.report?.overallStatus).toBe("healthy");
    expect(result.report?.executionId).toBe("exec-agent-1");
    expect(JSON.stringify(result.report)).not.toMatch(/service_role|secret|@/i);
  });

  it("registra métricas de sessão", async () => {
    const runtime = new OperationalAgentRuntime();
    const snapshotSource = {
      collect: () => createDeterministicOperationalSnapshot(),
    };

    await runtime.execute(
      {
        agentId: SYSTEM_DIAGNOSTICS_AGENT_ID,
        executionId: "exec-metrics-1",
        correlationId: "corr-metrics-1",
        requestId: "req-metrics-1",
        missionId: "mission-metrics",
        missionType: "operational_diagnostic",
        createdBy: "op-1",
      },
      snapshotSource,
      { instant: true },
    );

    const metrics = runtime.getMetrics(SYSTEM_DIAGNOSTICS_AGENT_ID);
    expect(metrics.executions).toBe(1);
    expect(metrics.completed).toBe(1);
    expect(metrics.lastOutcome).toBe("completed");
  });

  it("emite eventos agent com flag audited", () => {
    const events: Array<Record<string, unknown>> = [];
    new OperationalAgentRuntime({
      publish: (_topic, payload) => events.push(payload),
    });

    expect(events.length).toBeGreaterThan(0);
    expect(events.every((event) => event.audited === true)).toBe(true);
  });

  it("SystemDiagnosticsAgent produz recomendações determinísticas", async () => {
    const agent = createSystemDiagnosticsAgent({
      collect: () =>
        createDeterministicOperationalSnapshot({
          health: {
            status: "degraded",
            healthyCount: 6,
            warningCount: 2,
            criticalCount: 0,
            offlineCount: 0,
            modules: [{ moduleId: "x", moduleName: "X", status: "warning" }],
          },
        }),
    });

    const result = await agent.execute({
      executionId: "exec-report",
      correlationId: "corr-report",
      missionId: "m-report",
      instant: true,
    });

    expect(result.report.recommendations.length).toBeGreaterThan(0);
    expect(result.report.alertModules).toContain("X");
  });

  it("não possui capabilities perigosas no manifest", () => {
    const forbidden = ["deploy", "shell:execute", "secret:access", "migration"];
    for (const capability of SYSTEM_DIAGNOSTICS_AGENT_MANIFEST.capabilities) {
      for (const blocked of forbidden) {
        expect(capability).not.toContain(blocked);
      }
    }
  });
});

describe("Mission → Agent integration (unit)", () => {
  it("cancelamento via runtime aborta execução", async () => {
    const runtime = new OperationalAgentRuntime();
    const controller = new AbortController();
    const agent = createSystemDiagnosticsAgent({
      collect: async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return createDeterministicOperationalSnapshot();
      },
    });

    const promise = agent.execute({
      executionId: "exec-cancel",
      correlationId: "corr-cancel",
      missionId: "m-cancel",
      signal: controller.signal,
    });

    controller.abort();
    const result = await promise;
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("AGENT_CANCELLED");
  });
});
