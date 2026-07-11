import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  OWNER_PERMISSION_SEED_MIGRATION_FILE,
  verifyOwnerPermissionSeedMigrationSql,
} from "../../packages/security/src/server-authorization/OwnerPermissionSeedVerification.ts";
import type { ReleaseReadinessCheck } from "./ReleaseReadinessCheck.ts";
import { RELEASE_READINESS_CHECK_LABELS } from "./ReleaseReadinessCheck.ts";

function check(
  id: keyof typeof RELEASE_READINESS_CHECK_LABELS,
  outcome: ReleaseReadinessCheck["outcome"],
  message: string,
  options: { blocking?: boolean; docPath?: string } = {},
): ReleaseReadinessCheck {
  return {
    id,
    label: RELEASE_READINESS_CHECK_LABELS[id],
    outcome,
    message,
    blocking: options.blocking ?? true,
    docPath: options.docPath,
  };
}

const DOC_PATH = "docs/database/owner-permission-seed.md";

export function checkOwnerPermissionSeedMigrationPresent(
  repoRoot: string,
): ReleaseReadinessCheck {
  const path = join(repoRoot, "supabase", "migrations", OWNER_PERMISSION_SEED_MIGRATION_FILE);

  if (!existsSync(path)) {
    return check(
      "owner_permission_seed_migration_present",
      "fail",
      `${OWNER_PERMISSION_SEED_MIGRATION_FILE} ausente.`,
      { docPath: DOC_PATH },
    );
  }

  return check(
    "owner_permission_seed_migration_present",
    "pass",
    `Migration ${OWNER_PERMISSION_SEED_MIGRATION_FILE} presente.`,
    { docPath: DOC_PATH },
  );
}

export function checkOwnerPermissionSeedComplete(repoRoot: string): ReleaseReadinessCheck {
  const report = verifyOwnerPermissionSeedMigrationSql(repoRoot);

  if (!existsSync(report.migrationPath)) {
    return check(
      "owner_permission_seed_complete",
      "fail",
      "Migration owner permission seed ausente.",
      { docPath: DOC_PATH },
    );
  }

  const incomplete = report.issues.filter(
    (i) => i.code === "permission_missing" || i.code === "seed_incomplete",
  );

  if (incomplete.length > 0) {
    return check(
      "owner_permission_seed_complete",
      "fail",
      incomplete.map((i) => i.message).join("; "),
      { docPath: DOC_PATH },
    );
  }

  if (!report.valid) {
    const preview = report.issues
      .filter((i) => i.severity === "error")
      .slice(0, 2)
      .map((i) => i.message)
      .join("; ");
    return check(
      "owner_permission_seed_complete",
      "fail",
      preview || "Verificação owner seed incompleta.",
      { docPath: DOC_PATH },
    );
  }

  return check(
    "owner_permission_seed_complete",
    "pass",
    "4 permissões owner-exclusive presentes na migration.",
    { docPath: DOC_PATH },
  );
}

export function checkOwnerPermissionSeedOwnerOnly(repoRoot: string): ReleaseReadinessCheck {
  const report = verifyOwnerPermissionSeedMigrationSql(repoRoot);

  const violations = report.issues.filter(
    (i) =>
      i.code === "non_owner_grant" ||
      i.code === "admin_or_lower_grant",
  );

  if (violations.length > 0) {
    return check(
      "owner_permission_seed_owner_only",
      "fail",
      violations.map((i) => i.message).join("; "),
      { docPath: DOC_PATH },
    );
  }

  if (!report.valid) {
    return check(
      "owner_permission_seed_owner_only",
      "fail",
      "Migration owner seed inválida — owner-only não verificado.",
      { docPath: DOC_PATH },
    );
  }

  return check(
    "owner_permission_seed_owner_only",
    "pass",
    "Owner-exclusive associado somente à role owner.",
    { docPath: DOC_PATH },
  );
}

export function checkOwnerPermissionSeedNoAnon(repoRoot: string): ReleaseReadinessCheck {
  const report = verifyOwnerPermissionSeedMigrationSql(repoRoot);

  const anonIssues = report.issues.filter((i) => i.code === "anon_grant");

  if (anonIssues.length > 0) {
    return check(
      "owner_permission_seed_no_anon",
      "fail",
      "Grant ou policy permissiva para anon na migration owner seed.",
      { docPath: DOC_PATH },
    );
  }

  return check(
    "owner_permission_seed_no_anon",
    "pass",
    "Nenhum grant para anon na migration owner seed.",
    { docPath: DOC_PATH },
  );
}
