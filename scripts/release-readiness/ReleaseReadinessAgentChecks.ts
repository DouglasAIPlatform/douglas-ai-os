import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import type { ReleaseReadinessCheck } from "./ReleaseReadinessCheck.ts";
import { RELEASE_READINESS_CHECK_LABELS } from "./ReleaseReadinessCheck.ts";

const DOC_AGENT = "docs/agents/release-readiness-agent.md";
const DOC_ARCH = "docs/architecture/multi-agent-assignment.md";
const DOC_RUNBOOK = "docs/operations/release-readiness-agent-runbook.md";

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

export function checkReleaseReadinessAgentRegistered(repoRoot: string): ReleaseReadinessCheck {
  const path = join(repoRoot, "packages/agents/src/operational/ReleaseReadinessAgentTypes.ts");
  if (!existsSync(path)) {
    return check("release_readiness_agent_registered", "fail", "Release Readiness Agent ausente.");
  }

  const content = readFileSync(path, "utf8");
  const required = [
    'RELEASE_READINESS_AGENT_ID = "release-readiness-agent"',
    "Release Readiness Agent",
    '"1.0.0"',
    "release:inspect",
    "readOnly: true",
  ];
  const missing = required.filter((token) => !content.includes(token));
  if (missing.length) {
    return check(
      "release_readiness_agent_registered",
      "fail",
      `Manifest incompleto: ${missing.join(", ")}`,
    );
  }

  return check(
    "release_readiness_agent_registered",
    "pass",
    "Release Readiness Agent registrado.",
    DOC_AGENT,
  );
}

export function checkReleaseReadinessMissionTypePresent(repoRoot: string): ReleaseReadinessCheck {
  const missions = join(repoRoot, "packages/missions/src/execution/MissionExecutionTypes.ts");
  const executor = join(
    repoRoot,
    "packages/missions/src/execution/ReleaseReadinessMissionExecutor.ts",
  );

  if (!existsSync(executor)) {
    return check("release_readiness_mission_present", "fail", "ReleaseReadinessMissionExecutor ausente.");
  }

  const content = readFileSync(missions, "utf8");
  if (
    !content.includes("RELEASE_READINESS_REVIEW_MISSION_TYPE") ||
    !content.includes('"release_readiness_review"')
  ) {
    return check("release_readiness_mission_present", "fail", "Mission type ausente.");
  }

  return check("release_readiness_mission_present", "pass", "Missão release_readiness_review presente.", DOC_ARCH);
}

function readReleaseReadinessCapabilitiesBlock(repoRoot: string): string | null {
  const content = readFileSync(
    join(repoRoot, "packages/agents/src/operational/ReleaseReadinessAgentTypes.ts"),
    "utf8",
  );
  const match = content.match(/capabilities:\s*\[([\s\S]*?)\],\s*\n\s*readOnly:/);
  return match?.[1] ?? null;
}

export function checkReleaseReadinessAgentCapabilitiesSafe(
  repoRoot: string,
): ReleaseReadinessCheck {
  const capabilitiesBlock = readReleaseReadinessCapabilitiesBlock(repoRoot);
  if (!capabilitiesBlock) {
    return check(
      "release_readiness_agent_capabilities_safe",
      "fail",
      "Bloco capabilities do manifest ausente.",
    );
  }

  if (capabilitiesBlock.includes("release:approve_production")) {
    return check(
      "release_readiness_agent_capabilities_safe",
      "fail",
      "Capability release:approve_production detectada no manifest.",
    );
  }

  if (!capabilitiesBlock.includes("release:inspect")) {
    return check(
      "release_readiness_agent_capabilities_safe",
      "fail",
      "Capability release:inspect ausente.",
    );
  }

  return check(
    "release_readiness_agent_capabilities_safe",
    "pass",
    "Capabilities do Release Readiness Agent seguras.",
    DOC_AGENT,
  );
}

export function checkReleaseReadinessProductionApprovalAbsent(
  repoRoot: string,
): ReleaseReadinessCheck {
  const capabilitiesBlock = readReleaseReadinessCapabilitiesBlock(repoRoot);
  const safety = readFileSync(
    join(repoRoot, "packages/agents/src/operational/AgentExecutionSafetyPolicy.ts"),
    "utf8",
  );

  if (capabilitiesBlock?.includes("release:approve_production")) {
    return check(
      "release_readiness_production_approval_absent",
      "fail",
      "Agente possui release:approve_production nas capabilities.",
    );
  }

  if (!safety.includes("release:approve_production")) {
    return check(
      "release_readiness_production_approval_absent",
      "fail",
      "Política não bloqueia release:approve_production.",
    );
  }

  return check(
    "release_readiness_production_approval_absent",
    "pass",
    "Aprovação de produção ausente no agente.",
    DOC_RUNBOOK,
  );
}

export function checkReleaseReadinessMissionAgentIntegration(
  repoRoot: string,
): ReleaseReadinessCheck {
  const executor = readFileSync(
    join(repoRoot, "packages/missions/src/execution/ReleaseReadinessMissionExecutor.ts"),
    "utf8",
  );

  if (
    !executor.includes("resolveAssignment") ||
    !executor.includes("RELEASE_READINESS_AGENT_ID")
  ) {
    return check(
      "release_readiness_mission_agent_integration",
      "fail",
      "Integração Mission → Release Agent incompleta.",
    );
  }

  return check(
    "release_readiness_mission_agent_integration",
    "pass",
    "Integração Mission → Release Readiness Agent presente.",
    DOC_ARCH,
  );
}

export function runReleaseReadinessAgentTests(repoRoot: string): ReleaseReadinessCheck {
  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "vitest",
      "run",
      "packages/agents/src/operational/release-readiness-agent.test.ts",
    ],
    { cwd: repoRoot, shell: true, encoding: "utf8" },
  );

  if (result.status !== 0) {
    return check(
      "release_readiness_agent_tests_passing",
      "fail",
      `Testes release readiness agent falharam: ${result.stderr || result.stdout}`,
    );
  }

  return check("release_readiness_agent_tests_passing", "pass", "Testes release readiness agent passando.");
}

export function checkReleaseReadinessAgentDocsPresent(repoRoot: string): ReleaseReadinessCheck {
  const missing = [DOC_AGENT, DOC_ARCH, DOC_RUNBOOK].filter(
    (doc) => !existsSync(join(repoRoot, doc)),
  );
  if (missing.length) {
    return check(
      "release_readiness_agent_docs_present",
      "fail",
      `Documentação ausente: ${missing.join(", ")}`,
    );
  }
  return check("release_readiness_agent_docs_present", "pass", "Docs release readiness agent presentes.", DOC_AGENT);
}
