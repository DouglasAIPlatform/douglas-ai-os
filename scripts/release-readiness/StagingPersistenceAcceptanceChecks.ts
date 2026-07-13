import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import type { ReleaseReadinessCheck } from "./ReleaseReadinessCheck.ts";
import { RELEASE_READINESS_CHECK_LABELS } from "./ReleaseReadinessCheck.ts";

const DOC = "docs/operations/staging-persistence-acceptance.md";

function check(
  id: keyof typeof RELEASE_READINESS_CHECK_LABELS,
  outcome: ReleaseReadinessCheck["outcome"],
  message: string,
): ReleaseReadinessCheck {
  return {
    id,
    label: RELEASE_READINESS_CHECK_LABELS[id],
    outcome,
    message,
    blocking: true,
    docPath: DOC,
  };
}

export function checkStagingPersistenceAcceptanceSuitePresent(
  repoRoot: string,
): ReleaseReadinessCheck {
  const path = join(
    repoRoot,
    "packages/missions/src/execution/persistence/acceptance/StagingPersistenceAcceptanceSuite.ts",
  );
  if (!existsSync(path)) {
    return check("staging_persistence_acceptance_suite_present", "fail", "Suite ausente.");
  }
  const content = readFileSync(path, "utf8");
  if (!content.includes("StagingPersistenceAcceptanceSuite") || !content.includes("autoRun = false")) {
    return check("staging_persistence_acceptance_suite_present", "fail", "Suite inválida.");
  }
  return check(
    "staging_persistence_acceptance_suite_present",
    "pass",
    "StagingPersistenceAcceptanceSuite presente.",
  );
}

export function checkStagingPersistenceAcceptanceScenariosPresent(
  repoRoot: string,
): ReleaseReadinessCheck {
  const path = join(
    repoRoot,
    "packages/missions/src/execution/persistence/acceptance/StagingPersistenceAcceptanceScenarios.ts",
  );
  const content = readFileSync(path, "utf8");
  const required = [
    "system_diagnostics",
    "release_readiness",
    "recovery",
    "fallback_detection",
    "multi_agent_isolation",
  ];
  const missing = required.filter((id) => !content.includes(`"${id}"`));
  if (missing.length) {
    return check(
      "staging_persistence_acceptance_scenarios_present",
      "fail",
      `Cenários ausentes: ${missing.join(", ")}`,
    );
  }
  return check(
    "staging_persistence_acceptance_scenarios_present",
    "pass",
    "Cinco cenários de acceptance presentes.",
  );
}

export function checkStagingPersistenceReloadHandshakePresent(
  repoRoot: string,
): ReleaseReadinessCheck {
  const path = join(
    repoRoot,
    "packages/missions/src/execution/persistence/acceptance/AcceptanceReloadCheckpoint.ts",
  );
  const content = readFileSync(path, "utf8");
  if (
    !content.includes("AcceptanceContinuationToken")
    || !content.includes("AcceptanceReloadCheckpoint")
  ) {
    return check("staging_persistence_reload_handshake_present", "fail", "Handshake ausente.");
  }
  return check(
    "staging_persistence_reload_handshake_present",
    "pass",
    "Reload handshake presente.",
  );
}

export function checkStagingPersistenceRecoveryValidationPresent(
  repoRoot: string,
): ReleaseReadinessCheck {
  const path = join(
    repoRoot,
    "packages/missions/src/execution/persistence/acceptance/MissionExecutionRecoveryPresentation.ts",
  );
  if (!existsSync(path)) {
    return check("staging_persistence_recovery_validation_present", "fail", "Recovery presentation ausente.");
  }
  return check(
    "staging_persistence_recovery_validation_present",
    "pass",
    "Recovery validation presente.",
  );
}

export function checkStagingPersistenceMultiAgentIsolationPresent(
  repoRoot: string,
): ReleaseReadinessCheck {
  const path = join(
    repoRoot,
    "packages/missions/src/execution/persistence/acceptance/StagingPersistenceAcceptanceMetricsValidation.ts",
  );
  const content = readFileSync(path, "utf8");
  if (!content.includes("validateMultiAgentMetricsIsolation")) {
    return check("staging_persistence_multi_agent_isolation_present", "fail", "Isolamento ausente.");
  }
  return check(
    "staging_persistence_multi_agent_isolation_present",
    "pass",
    "Multi-agent isolation presente.",
  );
}

export function checkStagingAcceptanceScriptPresent(repoRoot: string): ReleaseReadinessCheck {
  const pkg = readFileSync(join(repoRoot, "package.json"), "utf8");
  if (!pkg.includes('"staging:acceptance:check"')) {
    return check("staging_acceptance_check_script_present", "fail", "Script ausente.");
  }
  return check(
    "staging_acceptance_check_script_present",
    "pass",
    "pnpm staging:acceptance:check disponível.",
  );
}

export function checkStagingPersistenceSafetyGateChecksPresent(
  repoRoot: string,
): ReleaseReadinessCheck {
  const path = join(
    repoRoot,
    "packages/supabase/src/production-safety/ProductionSafetyCheck.ts",
  );
  const content = readFileSync(path, "utf8");
  if (
    !content.includes("mission_persistence_remote_validated")
    || !content.includes("mission_fallback_inactive_staging")
  ) {
    return check("staging_persistence_safety_gate_checks_present", "fail", "Safety gate checks ausentes.");
  }
  return check(
    "staging_persistence_safety_gate_checks_present",
    "pass",
    "Production Safety Gate checks presentes.",
  );
}

export function runStagingPersistenceAcceptanceTests(
  repoRoot: string,
): ReleaseReadinessCheck {
  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "vitest",
      "run",
      "packages/missions/src/execution/staging-persistence-acceptance.test.ts",
    ],
    { cwd: repoRoot, shell: true, encoding: "utf8" },
  );
  if (result.status !== 0) {
    return check(
      "staging_persistence_acceptance_tests_passing",
      "fail",
      `Testes falharam: ${result.stderr || result.stdout}`,
    );
  }
  return check(
    "staging_persistence_acceptance_tests_passing",
    "pass",
    "Testes staging persistence acceptance passando.",
  );
}

export function checkStagingPersistenceAcceptanceDocsPresent(
  repoRoot: string,
): ReleaseReadinessCheck {
  const docs = [
    "docs/operations/staging-persistence-acceptance.md",
    "docs/architecture/persistence-rehydration-lifecycle.md",
    "docs/operations/mission-recovery-runbook.md",
  ];
  const missing = docs.filter((doc) => !existsSync(join(repoRoot, doc)));
  if (missing.length) {
    return check(
      "staging_persistence_acceptance_docs_present",
      "fail",
      `Docs ausentes: ${missing.join(", ")}`,
    );
  }
  return check(
    "staging_persistence_acceptance_docs_present",
    "pass",
    "Documentação acceptance presente.",
  );
}

export function checkStagingPersistenceAcceptanceWidgetPresent(
  repoRoot: string,
): ReleaseReadinessCheck {
  const widget = join(repoRoot, "apps/headquarters/components/widgets/MissionExecutionWidget.tsx");
  const content = readFileSync(widget, "utf8");
  if (!content.includes("Staging Persistence Acceptance")) {
    return check(
      "staging_persistence_acceptance_widget_present",
      "fail",
      "Widget acceptance ausente.",
    );
  }
  return check(
    "staging_persistence_acceptance_widget_present",
    "pass",
    "Widget acceptance presente.",
  );
}
