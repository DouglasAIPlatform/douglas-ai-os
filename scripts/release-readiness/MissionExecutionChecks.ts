import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import type { ReleaseReadinessCheck } from "./ReleaseReadinessCheck.ts";
import { RELEASE_READINESS_CHECK_LABELS } from "./ReleaseReadinessCheck.ts";

const DOC_ARCH = "docs/architecture/mission-execution-lifecycle.md";
const DOC_RUNBOOK = "docs/operations/mission-execution-runbook.md";

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

export function checkMissionExecutionCoordinatorPresent(repoRoot: string): ReleaseReadinessCheck {
  const path = join(
    repoRoot,
    "packages/missions/src/execution/MissionExecutionCoordinator.ts",
  );

  if (!existsSync(path)) {
    return check("mission_execution_coordinator_present", "fail", "MissionExecutionCoordinator ausente.");
  }

  const content = readFileSync(path, "utf8");
  if (!content.includes("class MissionExecutionCoordinator")) {
    return check("mission_execution_coordinator_present", "fail", "Coordinator incompleto.");
  }

  return check(
    "mission_execution_coordinator_present",
    "pass",
    "MissionExecutionCoordinator presente.",
    DOC_ARCH,
  );
}

export function checkMissionIdempotencyGuardPresent(repoRoot: string): ReleaseReadinessCheck {
  const path = join(
    repoRoot,
    "packages/missions/src/execution/MissionExecutionIdempotency.ts",
  );

  if (!existsSync(path)) {
    return check("mission_idempotency_guard_present", "fail", "Idempotency guard ausente.");
  }

  const content = readFileSync(path, "utf8");
  if (
    !content.includes("MissionExecutionIdempotencyGuard") ||
    !content.includes("MissionExecutionRegistry")
  ) {
    return check("mission_idempotency_guard_present", "fail", "Guard/registry incompletos.");
  }

  return check(
    "mission_idempotency_guard_present",
    "pass",
    "Idempotency guard e registry presentes.",
    DOC_ARCH,
  );
}

export function checkMissionEventsTyped(repoRoot: string): ReleaseReadinessCheck {
  const typedEvents = join(repoRoot, "packages/events/src/TypedEvents.ts");
  const content = readFileSync(typedEvents, "utf8");

  const required = [
    "mission:created",
    "mission:validated",
    "mission:planned",
    "mission:assigned",
    "mission:started",
    "mission:progress",
    "mission:completed",
    "mission:failed",
    "mission:cancelled",
    "mission:duplicate_rejected",
  ];

  const missing = required.filter((topic) => !content.includes(`"${topic}"`));
  if (missing.length) {
    return check(
      "mission_events_typed",
      "fail",
      `Eventos mission:* ausentes: ${missing.join(", ")}`,
    );
  }

  return check("mission_events_typed", "pass", "Eventos mission:* tipados no Event Bus.");
}

export function checkMissionExecutionWidgetIntegrated(repoRoot: string): ReleaseReadinessCheck {
  const widget = join(repoRoot, "apps/headquarters/components/widgets/MissionExecutionWidget.tsx");
  const page = join(repoRoot, "apps/headquarters/components/routing/HeadquartersPage.tsx");
  const integration = join(
    repoRoot,
    "apps/headquarters/features/mission-control/MissionExecutionIntegration.tsx",
  );

  if (!existsSync(widget) || !existsSync(integration)) {
    return check("mission_execution_widget_integrated", "fail", "Widget ou integração ausentes.");
  }

  const pageContent = readFileSync(page, "utf8");
  if (!pageContent.includes("MissionExecutionWidget")) {
    return check("mission_execution_widget_integrated", "fail", "Widget não integrado ao HQ.");
  }

  return check(
    "mission_execution_widget_integrated",
    "pass",
    "MissionExecutionWidget integrado ao Headquarters.",
    DOC_RUNBOOK,
  );
}

export function runMissionExecutionTests(repoRoot: string): ReleaseReadinessCheck {
  const result = spawnSync("pnpm", ["exec", "vitest", "run", "packages/missions/src/execution/mission-execution.test.ts"], {
    cwd: repoRoot,
    shell: true,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    return check(
      "mission_execution_tests_passing",
      "fail",
      `Testes de execução falharam: ${result.stderr || result.stdout}`,
    );
  }

  return check("mission_execution_tests_passing", "pass", "Testes de execução de missão passando.");
}

export function checkMissionNoExternalAiDependency(repoRoot: string): ReleaseReadinessCheck {
  const executor = join(
    repoRoot,
    "packages/missions/src/execution/DiagnosticMissionExecutor.ts",
  );
  const content = readFileSync(executor, "utf8");

  const forbidden = ["openai", "anthropic", "fetch(", "axios", "supabase"];
  const found = forbidden.filter((token) => content.toLowerCase().includes(token.toLowerCase()));

  if (found.length) {
    return check(
      "mission_no_external_ai_dependency",
      "fail",
      `Dependências externas detectadas no executor: ${found.join(", ")}`,
    );
  }

  return check(
    "mission_no_external_ai_dependency",
    "pass",
    "Executor diagnóstico sem dependência externa obrigatória.",
  );
}

export function checkMissionExecutionDocsPresent(repoRoot: string): ReleaseReadinessCheck {
  const missing = [DOC_ARCH, DOC_RUNBOOK].filter((doc) => !existsSync(join(repoRoot, doc)));

  if (missing.length) {
    return check(
      "mission_execution_docs_present",
      "fail",
      `Documentação ausente: ${missing.join(", ")}`,
    );
  }

  return check(
    "mission_execution_docs_present",
    "pass",
    "Documentação de execução de missões presente.",
    DOC_ARCH,
  );
}
