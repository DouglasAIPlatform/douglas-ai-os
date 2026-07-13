import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import type { ReleaseReadinessCheck } from "./ReleaseReadinessCheck.ts";
import { RELEASE_READINESS_CHECK_LABELS } from "./ReleaseReadinessCheck.ts";

const DOC_ARCH = "docs/architecture/mission-persistence.md";
const DOC_SCHEMA = "docs/database/mission-execution-schema.md";
const DOC_RUNBOOK = "docs/operations/mission-persistence-runbook.md";
const MIGRATION_FILE = "20250710210000_mission_executions.sql";

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

export function checkMissionPersistenceMigrationPresent(
  repoRoot: string,
): ReleaseReadinessCheck {
  const path = join(repoRoot, "supabase/migrations", MIGRATION_FILE);
  if (!existsSync(path)) {
    return check("mission_persistence_migration_present", "fail", "Migration mission_executions ausente.");
  }

  const content = readFileSync(path, "utf8");
  if (
    !content.includes("mission_executions") ||
    !content.includes("mission_execution_events") ||
    !content.includes("ENABLE ROW LEVEL SECURITY")
  ) {
    return check("mission_persistence_migration_present", "fail", "Migration incompleta.");
  }

  return check(
    "mission_persistence_migration_present",
    "pass",
    "Migration mission_executions presente.",
    DOC_SCHEMA,
  );
}

export function checkMissionPersistenceRlsEnabled(repoRoot: string): ReleaseReadinessCheck {
  const path = join(repoRoot, "supabase/migrations", MIGRATION_FILE);
  const content = readFileSync(path, "utf8");

  if (
    !content.includes("mission_executions_deny_anon") ||
    !content.includes("require_active_operator()")
  ) {
    return check("mission_persistence_rls_enabled", "fail", "RLS mission persistence incompleto.");
  }

  if (/USING\s*\(\s*true\s*\)/i.test(content) || /WITH CHECK\s*\(\s*true\s*\)/i.test(content)) {
    return check("mission_persistence_rls_enabled", "fail", "Policy permissiva detectada.");
  }

  return check("mission_persistence_rls_enabled", "pass", "RLS habilitado sem policies permissivas.", DOC_SCHEMA);
}

export function checkMissionPersistenceAnonDenied(repoRoot: string): ReleaseReadinessCheck {
  const content = readFileSync(
    join(repoRoot, "supabase/migrations", MIGRATION_FILE),
    "utf8",
  );
  if (!content.includes('TO anon') || !content.includes("mission_executions_deny_anon")) {
    return check("mission_persistence_anon_denied", "fail", "Anon não bloqueado explicitamente.");
  }
  return check("mission_persistence_anon_denied", "pass", "Anon sem acesso às execuções.");
}

export function checkSupabaseMissionPersistenceAdapterPresent(
  repoRoot: string,
): ReleaseReadinessCheck {
  const path = join(
    repoRoot,
    "packages/missions/src/execution/persistence/SupabaseMissionExecutionPersistence.ts",
  );
  if (!existsSync(path)) {
    return check("mission_persistence_supabase_adapter_present", "fail", "Adapter Supabase ausente.");
  }
  return check(
    "mission_persistence_supabase_adapter_present",
    "pass",
    "SupabaseMissionExecutionPersistence presente.",
    DOC_ARCH,
  );
}

export function checkMissionPersistenceFallbackPresent(
  repoRoot: string,
): ReleaseReadinessCheck {
  const composite = join(
    repoRoot,
    "packages/missions/src/execution/persistence/CompositeMissionExecutionPersistence.ts",
  );
  const session = join(
    repoRoot,
    "packages/missions/src/execution/MissionExecutionPersistenceAdapter.ts",
  );

  if (!existsSync(composite) || !existsSync(session)) {
    return check("mission_persistence_fallback_present", "fail", "Composite ou session fallback ausente.");
  }

  const content = readFileSync(composite, "utf8");
  if (!content.includes("SessionMissionExecutionPersistence") || !content.includes("fallbackActive")) {
    return check("mission_persistence_fallback_present", "fail", "Fallback session incompleto.");
  }

  return check("mission_persistence_fallback_present", "pass", "Fallback sessionStorage presente.", DOC_ARCH);
}

export function checkMissionRecoveryPolicyPresent(repoRoot: string): ReleaseReadinessCheck {
  const path = join(
    repoRoot,
    "packages/missions/src/execution/persistence/MissionExecutionRecoveryPolicy.ts",
  );
  if (!existsSync(path)) {
    return check("mission_recovery_policy_present", "fail", "Recovery policy ausente.");
  }
  const content = readFileSync(path, "utf8");
  if (!content.includes("evaluateMissionExecutionRecovery")) {
    return check("mission_recovery_policy_present", "fail", "Recovery policy incompleta.");
  }
  return check("mission_recovery_policy_present", "pass", "Recovery policy presente.", DOC_RUNBOOK);
}

export function runMissionPersistenceTests(repoRoot: string): ReleaseReadinessCheck {
  const result = spawnSync(
    "pnpm",
    ["exec", "vitest", "run", "packages/missions/src/execution/mission-persistence.test.ts"],
    {
      cwd: repoRoot,
      shell: true,
      encoding: "utf8",
    },
  );

  if (result.status !== 0) {
    return check(
      "mission_persistence_tests_passing",
      "fail",
      `Testes mission persistence falharam: ${result.stderr || result.stdout}`,
    );
  }

  return check("mission_persistence_tests_passing", "pass", "Testes mission persistence passando.");
}

export function checkMissionPersistenceDocsPresent(repoRoot: string): ReleaseReadinessCheck {
  const missing = [DOC_ARCH, DOC_SCHEMA, DOC_RUNBOOK].filter((doc) => !existsSync(join(repoRoot, doc)));
  if (missing.length) {
    return check(
      "mission_persistence_docs_present",
      "fail",
      `Documentação ausente: ${missing.join(", ")}`,
    );
  }
  return check("mission_persistence_docs_present", "pass", "Docs mission persistence presentes.", DOC_ARCH);
}

export function checkMissionPersistenceEventsTyped(repoRoot: string): ReleaseReadinessCheck {
  const typedEvents = join(repoRoot, "packages/events/src/TypedEvents.ts");
  const content = readFileSync(typedEvents, "utf8");
  const required = [
    "mission:persistence_saved",
    "mission:persistence_failed",
    "mission:persistence_fallback",
    "mission:persistence_rehydrated",
    "mission:recovery_required",
    "mission:persistence_validation_started",
    "mission:persistence_validation_passed",
    "mission:persistence_validation_failed",
    "mission:persistence_remote_confirmed",
    "mission:persistence_acceptance_started",
    "mission:persistence_acceptance_passed",
    "mission:persistence_acceptance_failed",
  ];
  const missing = required.filter((topic) => !content.includes(`"${topic}"`));
  if (missing.length) {
    return check(
      "mission_persistence_events_typed",
      "fail",
      `Eventos persistence ausentes: ${missing.join(", ")}`,
    );
  }
  return check("mission_persistence_events_typed", "pass", "Eventos mission:persistence_* tipados.");
}
