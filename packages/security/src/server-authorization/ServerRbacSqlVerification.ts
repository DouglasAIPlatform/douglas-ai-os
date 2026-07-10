import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const SERVER_RBAC_MIGRATION_FILE = "20250710180000_server_rbac_enforcement.sql";

export const REQUIRED_SQL_HELPERS = [
  "current_operator_profile",
  "current_operator_role",
  "operator_has_permission",
  "require_active_operator",
] as const;

export interface ServerRbacSqlVerificationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
}

export interface ServerRbacSqlVerificationReport {
  valid: boolean;
  migrationPath: string;
  issues: ServerRbacSqlVerificationIssue[];
}

function issue(
  severity: ServerRbacSqlVerificationIssue["severity"],
  code: string,
  message: string,
): ServerRbacSqlVerificationIssue {
  return { severity, code, message };
}

export function verifyServerRbacMigrationSql(
  repoRoot: string,
): ServerRbacSqlVerificationReport {
  const migrationPath = join(repoRoot, "supabase", "migrations", SERVER_RBAC_MIGRATION_FILE);
  const issues: ServerRbacSqlVerificationIssue[] = [];

  if (!existsSync(migrationPath)) {
    return {
      valid: false,
      migrationPath,
      issues: [issue("error", "migration_missing", `Migration ${SERVER_RBAC_MIGRATION_FILE} ausente.`)],
    };
  }

  const content = readFileSync(migrationPath, "utf8");
  const normalized = content.toLowerCase();

  for (const helper of REQUIRED_SQL_HELPERS) {
    if (!content.includes(helper)) {
      issues.push(
        issue("error", "helper_missing", `Helper SQL ausente: ${helper}()`),
      );
    }
  }

  if (!normalized.includes("auth.uid()")) {
    issues.push(issue("error", "auth_uid_missing", "auth.uid() não referenciado na migration."));
  }

  const tables = [
    "operator_profiles",
    "operational_audit_entries",
    "operator_role_permissions",
  ];

  for (const table of tables) {
    if (!content.includes(table)) {
      issues.push(issue("warning", "table_not_referenced", `Tabela ${table} não referenciada.`));
    }
  }

  if (!normalized.includes("enable row level security")) {
    issues.push(issue("warning", "rls_not_enabled", "ENABLE ROW LEVEL SECURITY não encontrado."));
  }

  const permissiveAnonPatterns = [
    /to\s+anon[\s\S]*?using\s*\(\s*true\s*\)/i,
    /for\s+all[\s\S]*?to\s+anon[\s\S]*?using\s*\(\s*true\s*\)/i,
  ];

  for (const pattern of permissiveAnonPatterns) {
    if (pattern.test(content)) {
      issues.push(
        issue("error", "permissive_anon_policy", "Policy permissiva detectada para anon."),
      );
    }
  }

  if (!content.includes("profile_inactive") && !content.includes("status = 'active'")) {
    issues.push(
      issue("warning", "inactive_profile_check", "Verificação de profile ativo não evidente."),
    );
  }

  if (!content.includes("operator_role_permissions")) {
    issues.push(
      issue("error", "permissions_table_missing", "operator_role_permissions não referenciada."),
    );
  }

  const hasErrors = issues.some((item) => item.severity === "error");

  return {
    valid: !hasErrors,
    migrationPath,
    issues,
  };
}

export function verifyAllRbacMigrations(repoRoot: string): ServerRbacSqlVerificationReport[] {
  const migrationsDir = join(repoRoot, "supabase", "migrations");
  const reports: ServerRbacSqlVerificationReport[] = [];

  reports.push(verifyServerRbacMigrationSql(repoRoot));

  const auditMigration = join(migrationsDir, "20250707130002_operational_audit_entries.sql");
  if (existsSync(auditMigration)) {
    const content = readFileSync(auditMigration, "utf8");
    const issues: ServerRbacSqlVerificationIssue[] = [];

    if (!content.includes("audit_entries_insert_denied_anon")) {
      issues.push(issue("error", "audit_anon_insert_denied", "INSERT anon negado em audit entries."));
    }
    if (!content.includes("WITH CHECK (false)")) {
      issues.push(issue("warning", "audit_insert_denied", "INSERT negado para authenticated."));
    }

    reports.push({
      valid: !issues.some((i) => i.severity === "error"),
      migrationPath: auditMigration,
      issues,
    });
  }

  return reports;
}
