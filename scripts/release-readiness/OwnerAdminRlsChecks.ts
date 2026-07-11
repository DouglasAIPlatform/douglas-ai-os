import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  OWNER_ADMIN_RLS_MIGRATION_FILE,
  verifyAuditInsertStillDenied,
  verifyOwnerAdminRlsMigrationSql,
} from "../../packages/security/src/server-authorization/OwnerAdminRlsVerification.ts";
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

const DOC_PATH = "docs/database/rbac-rls-policies.md";

export function checkOwnerAdminRlsSeparated(repoRoot: string): ReleaseReadinessCheck {
  const report = verifyOwnerAdminRlsMigrationSql(repoRoot);

  if (!existsSync(report.migrationPath)) {
    return check("owner_admin_rls_separated", "fail", "Migration RLS owner/admin ausente.", {
      docPath: DOC_PATH,
    });
  }

  const grouped = report.issues.filter((i) => i.code === "owner_admin_grouped");
  if (grouped.length > 0) {
    return check(
      "owner_admin_rls_separated",
      "fail",
      grouped.map((i) => i.message).join("; "),
      { docPath: DOC_PATH },
    );
  }

  if (!report.valid) {
    const preview = report.issues
      .filter((i) => i.severity === "error")
      .slice(0, 2)
      .map((i) => i.message)
      .join("; ");
    return check("owner_admin_rls_separated", "fail", preview, { docPath: DOC_PATH });
  }

  return check(
    "owner_admin_rls_separated",
    "pass",
    "Policies owner/admin separadas — sem has_platform_role(ARRAY['owner','admin']) em mutações.",
    { docPath: DOC_PATH },
  );
}

export function checkAdminCannotPromoteOwner(repoRoot: string): ReleaseReadinessCheck {
  const report = verifyOwnerAdminRlsMigrationSql(repoRoot);

  const violations = report.issues.filter(
    (i) =>
      i.code === "admin_can_promote_owner" ||
      i.code === "admin_owner_role_grant" ||
      i.code === "owner_promote_guard_missing",
  );

  if (violations.length > 0) {
    return check(
      "admin_cannot_promote_owner",
      "fail",
      violations.map((i) => i.message).join("; "),
      { docPath: DOC_PATH },
    );
  }

  if (!report.valid) {
    return check(
      "admin_cannot_promote_owner",
      "fail",
      "Verificação RLS owner/admin falhou.",
      { docPath: DOC_PATH },
    );
  }

  return check(
    "admin_cannot_promote_owner",
    "pass",
    "Admin restrito a operator/viewer — owner exige can_promote_to_owner().",
    { docPath: DOC_PATH },
  );
}

export function checkInactiveProfileRlsBlocked(repoRoot: string): ReleaseReadinessCheck {
  const report = verifyOwnerAdminRlsMigrationSql(repoRoot);

  const inactiveIssues = report.issues.filter(
    (i) => i.code === "admin_inactive_allowed" || i.code === "helper_missing",
  );

  if (inactiveIssues.length > 0) {
    return check(
      "inactive_profile_rls_blocked",
      "fail",
      inactiveIssues.map((i) => i.message).join("; "),
      { docPath: DOC_PATH },
    );
  }

  if (!report.valid) {
    return check(
      "inactive_profile_rls_blocked",
      "fail",
      "Policies administrativas sem require_active_operator.",
      { docPath: DOC_PATH },
    );
  }

  return check(
    "inactive_profile_rls_blocked",
    "pass",
    "Policies administrativas exigem profile active via helpers.",
    { docPath: DOC_PATH },
  );
}

export function checkNoPermissiveRbacPolicies(repoRoot: string): ReleaseReadinessCheck {
  const report = verifyOwnerAdminRlsMigrationSql(repoRoot);

  const permissive = report.issues.filter(
    (i) => i.code === "permissive_policy" || i.code === "anon_grant",
  );

  if (permissive.length > 0) {
    return check(
      "no_permissive_rbac_policies",
      "fail",
      permissive.map((i) => i.message).join("; "),
      { docPath: DOC_PATH },
    );
  }

  if (!verifyAuditInsertStillDenied(repoRoot)) {
    return check(
      "no_permissive_rbac_policies",
      "fail",
      "INSERT em operational_audit_entries não negado explicitamente.",
      { docPath: DOC_PATH },
    );
  }

  return check(
    "no_permissive_rbac_policies",
    "pass",
    "Sem policies permissivas; audit INSERT continua negado ao client.",
    { docPath: DOC_PATH },
  );
}
