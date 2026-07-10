import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  REQUIRED_SQL_HELPERS,
  SERVER_RBAC_MIGRATION_FILE,
  verifyAllRbacMigrations,
  verifyServerRbacMigrationSql,
} from "../../packages/security/src/server-authorization/ServerRbacSqlVerification.ts";
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

export function checkServerRbacMigrationPresent(repoRoot: string): ReleaseReadinessCheck {
  const path = join(repoRoot, "supabase", "migrations", SERVER_RBAC_MIGRATION_FILE);
  const docPath = "docs/security/server-side-rbac-enforcement.md";

  if (!existsSync(path)) {
    return check(
      "server_rbac_migration_present",
      "fail",
      `${SERVER_RBAC_MIGRATION_FILE} ausente.`,
      { docPath },
    );
  }

  return check(
    "server_rbac_migration_present",
    "pass",
    `Migration ${SERVER_RBAC_MIGRATION_FILE} presente.`,
    { docPath },
  );
}

export function checkServerRbacHelpersPresent(repoRoot: string): ReleaseReadinessCheck {
  const report = verifyServerRbacMigrationSql(repoRoot);
  const docPath = "docs/database/rbac-rls-policies.md";

  if (!existsSync(report.migrationPath)) {
    return check(
      "server_rbac_helpers_present",
      "fail",
      "Migration server RBAC ausente.",
      { docPath },
    );
  }

  const missing = REQUIRED_SQL_HELPERS.filter(
    (helper) => !readFileSync(report.migrationPath, "utf8").includes(helper),
  );

  if (missing.length > 0) {
    return check(
      "server_rbac_helpers_present",
      "fail",
      `Helpers ausentes: ${missing.join(", ")}.`,
      { docPath },
    );
  }

  if (!report.valid) {
    const preview = report.issues
      .filter((i) => i.severity === "error")
      .slice(0, 3)
      .map((i) => i.message)
      .join("; ");
    return check(
      "server_rbac_helpers_present",
      "fail",
      `Verificação SQL falhou: ${preview}`,
      { docPath },
    );
  }

  return check(
    "server_rbac_helpers_present",
    "pass",
    `${REQUIRED_SQL_HELPERS.length} helpers essenciais presentes.`,
    { docPath },
  );
}

export function checkServerRbacNoPermissiveAnon(repoRoot: string): ReleaseReadinessCheck {
  const reports = verifyAllRbacMigrations(repoRoot);
  const docPath = "docs/database/rbac-rls-policies.md";

  const permissive = reports.flatMap((r) =>
    r.issues.filter((i) => i.code === "permissive_anon_policy"),
  );

  if (permissive.length > 0) {
    return check(
      "server_rbac_no_permissive_anon",
      "fail",
      "Policy permissiva para anon detectada em migrations RBAC.",
      { docPath },
    );
  }

  const failedAuditAnon = reports.some((r) =>
    r.issues.some((i) => i.code === "audit_anon_insert_denied"),
  );

  if (failedAuditAnon) {
    return check(
      "server_rbac_no_permissive_anon",
      "fail",
      "INSERT anon em operational_audit_entries não negado explicitamente.",
      { docPath },
    );
  }

  return check(
    "server_rbac_no_permissive_anon",
    "pass",
    "Nenhuma policy obviamente permissiva para anon.",
    { docPath },
  );
}

export function runServerRbacTests(repoRoot: string): ReleaseReadinessCheck {
  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "vitest",
      "run",
      "packages/security/src/server-authorization/server-authorization.rbac.test.ts",
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  if (result.status === 0) {
    return check(
      "server_rbac_tests_passing",
      "pass",
      "Testes server-side RBAC passaram.",
      { docPath: "docs/security/server-side-rbac-enforcement.md" },
    );
  }

  const hint =
    (result.stderr ?? "").split("\n").slice(-6).join("\n").trim() ||
    (result.stdout ?? "").split("\n").slice(-6).join("\n").trim();

  return check(
    "server_rbac_tests_passing",
    "fail",
    `pnpm test:rbac falhou. ${hint}`,
    { docPath: "docs/security/server-side-rbac-enforcement.md" },
  );
}
