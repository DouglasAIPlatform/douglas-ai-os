import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import type { ReleaseReadinessCheck } from "./ReleaseReadinessCheck.ts";
import { RELEASE_READINESS_CHECK_LABELS } from "./ReleaseReadinessCheck.ts";

const DOC_VALIDATION = "docs/operations/remote-mission-persistence-validation.md";
const DOC_SCENARIOS = "docs/operations/mission-persistence-acceptance-scenarios.md";
const VALIDATOR_PATH =
  "packages/missions/src/execution/persistence/remote/MissionPersistenceRuntimeValidator.ts";
const TEST_DATA_POLICY_PATH =
  "packages/missions/src/execution/persistence/remote/MissionPersistenceTestDataPolicy.ts";
const REMOTE_REPORT_PATH =
  "packages/missions/src/execution/persistence/remote/MissionPersistenceRemoteReport.ts";
const HQ_HOOK_PATH =
  "apps/headquarters/features/mission-control/useMissionPersistenceRemoteValidation.ts";

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

export function checkMissionPersistenceRuntimeValidatorPresent(
  repoRoot: string,
): ReleaseReadinessCheck {
  const path = join(repoRoot, VALIDATOR_PATH);
  if (!existsSync(path)) {
    return check("mission_persistence_runtime_validator_present", "fail", "Runtime validator ausente.");
  }
  const content = readFileSync(path, "utf8");
  if (!content.includes("MissionPersistenceRuntimeValidator") || !content.includes("autoRun = false")) {
    return check(
      "mission_persistence_runtime_validator_present",
      "fail",
      "Validator inválido ou auto-run habilitado.",
    );
  }
  return check(
    "mission_persistence_runtime_validator_present",
    "pass",
    "MissionPersistenceRuntimeValidator presente.",
    DOC_VALIDATION,
  );
}

export function checkMissionPersistenceRemoteReportPresent(
  repoRoot: string,
): ReleaseReadinessCheck {
  if (!existsSync(join(repoRoot, REMOTE_REPORT_PATH))) {
    return check("mission_persistence_remote_report_present", "fail", "Remote report ausente.");
  }
  return check(
    "mission_persistence_remote_report_present",
    "pass",
    "MissionPersistenceRemoteReport presente.",
    DOC_VALIDATION,
  );
}

export function checkMissionPersistenceTestDataPolicyPresent(
  repoRoot: string,
): ReleaseReadinessCheck {
  const path = join(repoRoot, TEST_DATA_POLICY_PATH);
  if (!existsSync(path)) {
    return check("mission_persistence_test_data_policy_present", "fail", "Test data policy ausente.");
  }
  const content = readFileSync(path, "utf8");
  if (!content.includes("MISSION_PERSISTENCE_ACCEPTANCE_PREFIX") || !content.includes("autoDelete: false")) {
    return check("mission_persistence_test_data_policy_present", "fail", "Policy incompleta.");
  }
  return check(
    "mission_persistence_test_data_policy_present",
    "pass",
    "MissionPersistenceTestDataPolicy presente.",
    DOC_SCENARIOS,
  );
}

export function checkStagingRequiresSupabaseRequiredPersistence(
  repoRoot: string,
): ReleaseReadinessCheck {
  const path = join(repoRoot, "apps/headquarters/features/mission-control/missionExecutionPersistenceConfig.ts");
  const content = readFileSync(path, "utf8");
  if (
    !content.includes("supabase_required")
    || !content.includes('effectiveEnvironment === "staging"')
  ) {
    return check(
      "staging_requires_supabase_required_persistence",
      "fail",
      "Staging não exige supabase_required.",
    );
  }
  return check(
    "staging_requires_supabase_required_persistence",
    "pass",
    "Staging exige supabase_required.",
    DOC_VALIDATION,
  );
}

export function checkMissionPersistenceNoServiceRoleFrontend(
  repoRoot: string,
): ReleaseReadinessCheck {
  const paths = [VALIDATOR_PATH, HQ_HOOK_PATH];
  const patterns = [/SUPABASE_SERVICE_ROLE/i, /service_role_key/i, /serviceRoleKey/i];
  for (const relative of paths) {
    const content = readFileSync(join(repoRoot, relative), "utf8");
    if (patterns.some((pattern) => pattern.test(content))) {
      return check(
        "mission_persistence_no_service_role_frontend",
        "fail",
        `service_role referenciado em ${relative}.`,
      );
    }
  }
  return check(
    "mission_persistence_no_service_role_frontend",
    "pass",
    "Nenhum service_role no frontend de persistência.",
  );
}

export function runMissionPersistenceRemoteReadinessTests(
  repoRoot: string,
): ReleaseReadinessCheck {
  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "vitest",
      "run",
      "packages/missions/src/execution/mission-persistence-remote-readiness.test.ts",
    ],
    { cwd: repoRoot, shell: true, encoding: "utf8" },
  );

  if (result.status !== 0) {
    return check(
      "mission_persistence_remote_readiness_tests_passing",
      "fail",
      `Testes remote readiness falharam: ${result.stderr || result.stdout}`,
    );
  }

  return check(
    "mission_persistence_remote_readiness_tests_passing",
    "pass",
    "Testes remote mission persistence readiness passando.",
  );
}

export function checkMissionPersistenceRemoteReadinessDocsPresent(
  repoRoot: string,
): ReleaseReadinessCheck {
  const missing = [DOC_VALIDATION, DOC_SCENARIOS].filter((doc) => !existsSync(join(repoRoot, doc)));
  if (missing.length) {
    return check(
      "mission_persistence_remote_readiness_docs_present",
      "fail",
      `Docs ausentes: ${missing.join(", ")}`,
    );
  }
  return check(
    "mission_persistence_remote_readiness_docs_present",
    "pass",
    "Docs remote mission persistence presentes.",
    DOC_VALIDATION,
  );
}

export function checkMissionPersistenceRemoteValidationWidgetPresent(
  repoRoot: string,
): ReleaseReadinessCheck {
  const widget = join(repoRoot, "apps/headquarters/components/widgets/MissionExecutionWidget.tsx");
  const content = readFileSync(widget, "utf8");
  if (
    !content.includes("Validação de persistência remota")
    || !content.includes("Executar validação segura")
  ) {
    return check(
      "mission_persistence_remote_validation_widget_present",
      "fail",
      "Widget sem seção de validação remota.",
    );
  }
  return check(
    "mission_persistence_remote_validation_widget_present",
    "pass",
    "Widget com validação remota presente.",
  );
}
