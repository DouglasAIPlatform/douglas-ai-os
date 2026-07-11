import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import type { ReleaseReadinessCheck } from "./ReleaseReadinessCheck.ts";
import { RELEASE_READINESS_CHECK_LABELS } from "./ReleaseReadinessCheck.ts";

const DOC_AGENT = "docs/agents/system-diagnostics-agent.md";
const DOC_ARCH = "docs/architecture/operational-agent-runtime.md";
const DOC_RUNBOOK = "docs/operations/agent-execution-runbook.md";

function check(
  id: keyof typeof RELEASE_READINESS_CHECK_LABELS,
  outcome: ReleaseReadinessCheck["outcome"],
  message: string,
  docPath?: string,
): ReleaseReadinessCheck {
  return {
    id,
    label: RELEASE_READINESS_CHECK_LABELS[id],
    outcome,
    message,
    blocking: true,
    docPath,
  };
}

export function checkSystemDiagnosticsAgentRegistered(
  repoRoot: string,
): ReleaseReadinessCheck {
  const typesPath = join(
    repoRoot,
    "packages/agents/src/operational/OperationalAgentTypes.ts",
  );

  if (!existsSync(typesPath)) {
    return check(
      "system_diagnostics_agent_registered",
      "fail",
      "OperationalAgentTypes ausente.",
    );
  }

  const content = readFileSync(typesPath, "utf8");
  const required = [
    'SYSTEM_DIAGNOSTICS_AGENT_ID = "system-diagnostics-agent"',
    "System Diagnostics Agent",
    '"1.0.0"',
    "platform:diagnostics",
    "readOnly: true",
  ];

  const missing = required.filter((token) => !content.includes(token));
  if (missing.length) {
    return check(
      "system_diagnostics_agent_registered",
      "fail",
      `Manifest incompleto: ${missing.join(", ")}`,
    );
  }

  return check(
    "system_diagnostics_agent_registered",
    "pass",
    "System Diagnostics Agent registrado com identidade 1.0.0.",
    DOC_AGENT,
  );
}

export function checkAgentManifestSafeCapabilities(
  repoRoot: string,
): ReleaseReadinessCheck {
  const safetyPath = join(
    repoRoot,
    "packages/agents/src/operational/AgentExecutionSafetyPolicy.ts",
  );

  if (!existsSync(safetyPath)) {
    return check(
      "agent_manifest_safe_capabilities",
      "fail",
      "AgentExecutionSafetyPolicy ausente.",
    );
  }

  const content = readFileSync(safetyPath, "utf8");
  const forbidden = [
    "deploy",
    "shell",
    "secret",
    "migration",
    "service_role",
  ];
  const missing = forbidden.filter((token) => !content.includes(token));

  if (missing.length) {
    return check(
      "agent_manifest_safe_capabilities",
      "fail",
      `Política de segurança incompleta: ${missing.join(", ")}`,
    );
  }

  return check(
    "agent_manifest_safe_capabilities",
    "pass",
    "Capabilities seguras e política read-only presentes.",
    DOC_ARCH,
  );
}

export function checkMissionAgentIntegrationPresent(
  repoRoot: string,
): ReleaseReadinessCheck {
  const executor = join(
    repoRoot,
    "packages/missions/src/execution/DiagnosticMissionExecutor.ts",
  );
  const coordinator = join(
    repoRoot,
    "packages/missions/src/execution/MissionExecutionCoordinator.ts",
  );

  if (!existsSync(executor) || !existsSync(coordinator)) {
    return check(
      "mission_agent_integration_present",
      "fail",
      "Executor ou coordinator ausentes.",
    );
  }

  const executorContent = readFileSync(executor, "utf8");
  const coordinatorContent = readFileSync(coordinator, "utf8");

  if (
    !executorContent.includes("OperationalAgentRuntime") ||
    !executorContent.includes("resolveAssignment") ||
    !coordinatorContent.includes("agentRuntime")
  ) {
    return check(
      "mission_agent_integration_present",
      "fail",
      "Integração Mission → Agent incompleta.",
    );
  }

  return check(
    "mission_agent_integration_present",
    "pass",
    "MissionExecutionCoordinator delega ao OperationalAgentRuntime.",
    DOC_ARCH,
  );
}

export function checkAgentEventsTyped(repoRoot: string): ReleaseReadinessCheck {
  const typedEvents = join(repoRoot, "packages/events/src/TypedEvents.ts");
  const content = readFileSync(typedEvents, "utf8");

  const required = [
    "agent:registered",
    "agent:assigned",
    "agent:execution_started",
    "agent:progress",
    "agent:execution_completed",
    "agent:execution_failed",
    "agent:execution_cancelled",
    "agent:assignment_rejected",
  ];

  const missing = required.filter((topic) => !content.includes(`"${topic}"`));
  if (missing.length) {
    return check(
      "agent_events_typed",
      "fail",
      `Eventos agent:* ausentes: ${missing.join(", ")}`,
    );
  }

  return check("agent_events_typed", "pass", "Eventos agent:* tipados no Event Bus.");
}

export function runOperationalAgentTests(repoRoot: string): ReleaseReadinessCheck {
  const result = spawnSync(
    "pnpm",
    ["exec", "vitest", "run", "packages/agents/src/operational/operational-agent.test.ts"],
    {
      cwd: repoRoot,
      shell: true,
      encoding: "utf8",
    },
  );

  if (result.status !== 0) {
    return check(
      "operational_agent_tests_passing",
      "fail",
      `Testes do agent runtime falharam: ${result.stderr || result.stdout}`,
    );
  }

  return check(
    "operational_agent_tests_passing",
    "pass",
    "Testes do operational agent runtime passando.",
  );
}

export function checkAgentRuntimeDocsPresent(repoRoot: string): ReleaseReadinessCheck {
  const missing = [DOC_AGENT, DOC_ARCH, DOC_RUNBOOK].filter(
    (doc) => !existsSync(join(repoRoot, doc)),
  );

  if (missing.length) {
    return check(
      "agent_runtime_docs_present",
      "fail",
      `Documentação ausente: ${missing.join(", ")}`,
    );
  }

  return check(
    "agent_runtime_docs_present",
    "pass",
    "Documentação do operational agent runtime presente.",
    DOC_ARCH,
  );
}
