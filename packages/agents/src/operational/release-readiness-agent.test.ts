import { describe, expect, it } from "vitest";
import {
  AgentCapabilityMatcher,
  OperationalAgentRegistry,
  OperationalAgentRuntime,
  RELEASE_READINESS_AGENT_ID,
  RELEASE_READINESS_AGENT_MANIFEST,
  RELEASE_READINESS_FORBIDDEN_ACTIONS,
  RELEASE_READINESS_REQUIRED_CAPABILITIES,
  RELEASE_READINESS_REVIEW_MISSION_TYPE,
  SYSTEM_DIAGNOSTICS_AGENT_ID,
  SYSTEM_DIAGNOSTICS_AGENT_MANIFEST,
  createDeterministicReleaseReadinessSnapshot,
  createReleaseReadinessAgent,
  deriveReleaseReadinessVerdict,
  validateAgentCapabilitiesSafe,
} from "./index";

describe("Release Readiness Agent (Sprint 5.52)", () => {
  it("registra segundo agente operacional", () => {
    const registry = new OperationalAgentRegistry();
    expect(registry.get(RELEASE_READINESS_AGENT_ID)?.name).toBe("Release Readiness Agent");
    expect(registry.list()).toHaveLength(2);
  });

  it("manifest possui identidade 1.0.0 read-only", () => {
    expect(RELEASE_READINESS_AGENT_MANIFEST.version).toBe("1.0.0");
    expect(RELEASE_READINESS_AGENT_MANIFEST.readOnly).toBe(true);
    expect(RELEASE_READINESS_AGENT_MANIFEST.department).toBe("Governance");
    expect(RELEASE_READINESS_AGENT_MANIFEST.supportedMissionTypes).toContain(
      RELEASE_READINESS_REVIEW_MISSION_TYPE,
    );
  });

  it("possui apenas capabilities read-only permitidas", () => {
    const { safe, violations } = validateAgentCapabilitiesSafe(
      RELEASE_READINESS_AGENT_MANIFEST.capabilities,
    );
    expect(safe).toBe(true);
    expect(violations).toHaveLength(0);
    expect(RELEASE_READINESS_AGENT_MANIFEST.capabilities).toContain("release:inspect");
    expect(RELEASE_READINESS_AGENT_MANIFEST.capabilities).not.toContain("release:approve_production");
  });

  it("não inclui capabilities perigosas no manifest", () => {
    for (const capability of RELEASE_READINESS_AGENT_MANIFEST.capabilities) {
      for (const forbidden of RELEASE_READINESS_FORBIDDEN_ACTIONS) {
        expect(capability).not.toBe(forbidden);
      }
    }
  });

  it("atribui release_readiness_review ao agente correto", () => {
    const registry = new OperationalAgentRegistry();
    const matcher = new AgentCapabilityMatcher(registry.list(), (id) => registry.getStatus(id));

    const result = matcher.match({
      missionType: RELEASE_READINESS_REVIEW_MISSION_TYPE,
      requiredCapabilities: [...RELEASE_READINESS_REQUIRED_CAPABILITIES],
    });

    expect(result.decision).toBe("assigned");
    expect(result.agentId).toBe(RELEASE_READINESS_AGENT_ID);
  });

  it("mantém operational_diagnostic no diagnostics agent", () => {
    const registry = new OperationalAgentRegistry();
    const matcher = new AgentCapabilityMatcher(registry.list(), (id) => registry.getStatus(id));

    const result = matcher.match({
      missionType: "operational_diagnostic",
      requiredCapabilities: ["platform:diagnostics"],
    });

    expect(result.agentId).toBe(SYSTEM_DIAGNOSTICS_AGENT_ID);
  });

  it("rejeita missão incompatível", () => {
    const registry = new OperationalAgentRegistry();
    const matcher = new AgentCapabilityMatcher(registry.list(), (id) => registry.getStatus(id));

    const result = matcher.match({
      missionType: "deploy_production",
      requiredCapabilities: ["release:inspect"],
    });

    expect(result.decision).toBe("rejected_incompatible");
  });

  it("calcula verdict ready_for_staging", () => {
    const snapshot = createDeterministicReleaseReadinessSnapshot();
    const blockers: never[] = [];
    expect(deriveReleaseReadinessVerdict({ snapshot, blockers })).toBe("ready_for_staging");
  });

  it("calcula verdict ready_for_production_review em production", () => {
    const snapshot = createDeterministicReleaseReadinessSnapshot({
      staging: {
        status: "passed",
        bootstrapStatus: "configured",
        effectiveEnvironment: "production",
        blockingCount: 0,
        pendingRuntimeCount: 0,
        passedCount: 8,
        blockers: [],
        alerts: [],
      },
      environment: {
        canonical: "production",
        releaseChannel: "production",
        effectiveEnvironment: "production",
        declaredExplicitly: true,
        hasCriticalMismatch: false,
        warnings: [],
      },
      release: {
        version: "0.1.0",
        channel: "production",
        releaseStatus: "draft",
        environment: "production",
        environmentLabel: "Production",
        versionConsistent: true,
        staticReadinessValid: true,
        runtimeReadinessHint: "hint",
        alerts: [],
      },
    });

    expect(deriveReleaseReadinessVerdict({ snapshot, blockers: [] })).toBe(
      "ready_for_production_review",
    );
  });

  it("calcula verdict blocked com staging failed", () => {
    const snapshot = createDeterministicReleaseReadinessSnapshot({
      staging: {
        status: "failed",
        bootstrapStatus: "not_configured",
        effectiveEnvironment: "development",
        blockingCount: 2,
        pendingRuntimeCount: 0,
        passedCount: 1,
        blockers: ["Mocks não permitidos em staging"],
        alerts: [],
      },
    });

    expect(
      deriveReleaseReadinessVerdict({
        snapshot,
        blockers: [{ id: "b1", category: "staging", message: "fail", severity: "critical" }],
      }),
    ).toBe("blocked");
  });

  it("calcula insufficient_data sem snapshots essenciais", () => {
    const snapshot = createDeterministicReleaseReadinessSnapshot({
      release: null,
      environment: null,
    });

    expect(deriveReleaseReadinessVerdict({ snapshot, blockers: [] })).toBe("insufficient_data");
  });

  it("executa agente com relatório sanitizado", async () => {
    const agent = createReleaseReadinessAgent({
      collect: () => createDeterministicReleaseReadinessSnapshot(),
    });

    const result = await agent.execute({
      executionId: "exec-rr-1",
      correlationId: "corr-rr-1",
      missionId: "mission-rr-1",
      instant: true,
    });

    expect(result.report.verdict).toBe("ready_for_staging");
    expect(result.report.readOnlyNotice).toContain("Não aprova");
    expect(JSON.stringify(result.report)).not.toMatch(/service_role|secret|@/i);
  });

  it("runtime executa release readiness agent", async () => {
    const runtime = new OperationalAgentRuntime();
    const result = await runtime.execute(
      {
        agentId: RELEASE_READINESS_AGENT_ID,
        executionId: "exec-rr-runtime",
        correlationId: "corr-rr-runtime",
        requestId: "req-rr-runtime",
        missionId: "mission-rr",
        missionType: RELEASE_READINESS_REVIEW_MISSION_TYPE,
        createdBy: "op-1",
      },
      { releaseReadiness: { collect: () => createDeterministicReleaseReadinessSnapshot() } },
      { instant: true },
    );

    expect(result.success).toBe(true);
    expect(result.releaseReadinessReport?.verdict).toBe("ready_for_staging");
  });

  it("owner continua sendo o único capaz de aprovar produção — agente não possui capability", () => {
    expect(RELEASE_READINESS_AGENT_MANIFEST.capabilities).not.toContain("release:approve_production");
    expect(SYSTEM_DIAGNOSTICS_AGENT_MANIFEST.capabilities).not.toContain("release:approve_production");
  });
});
