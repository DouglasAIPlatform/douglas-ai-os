import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/** Alinhado ao canônico — packages/security/rbac-catalog.json */
export const REQUIRED_OWNER_SEED_PERMISSIONS = [
  "security:manage_roles",
  "security:manage_owners",
  "release:approve_production",
  "platform:critical_configuration",
] as const;
export const OWNER_PERMISSION_SEED_MIGRATION_FILE =
  "20250710190000_owner_permission_seed.sql";

const NON_OWNER_ROLES = ["admin", "operator", "viewer"] as const;

export interface OwnerPermissionSeedVerificationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
}

export interface OwnerPermissionSeedVerificationReport {
  valid: boolean;
  migrationPath: string;
  issues: OwnerPermissionSeedVerificationIssue[];
}

function issue(
  severity: OwnerPermissionSeedVerificationIssue["severity"],
  code: string,
  message: string,
): OwnerPermissionSeedVerificationIssue {
  return { severity, code, message };
}

function extractInsertTuples(content: string): Array<{ role: string; permission: string }> {
  const tuples: Array<{ role: string; permission: string }> = [];
  const insertBlock = content.match(
    /INSERT\s+INTO\s+public\.operator_role_permissions[\s\S]*?VALUES\s*([\s\S]*?)ON\s+CONFLICT/i,
  );

  if (!insertBlock) {
    return tuples;
  }

  const rowPattern = /\(\s*'(\w+)'\s*,\s*'([^']+)'/g;
  let match: RegExpExecArray | null;
  while ((match = rowPattern.exec(insertBlock[1])) !== null) {
    tuples.push({ role: match[1], permission: match[2] });
  }

  return tuples;
}

export function verifyOwnerPermissionSeedMigrationSql(
  repoRoot: string,
): OwnerPermissionSeedVerificationReport {
  const migrationPath = join(
    repoRoot,
    "supabase",
    "migrations",
    OWNER_PERMISSION_SEED_MIGRATION_FILE,
  );
  const issues: OwnerPermissionSeedVerificationIssue[] = [];

  if (!existsSync(migrationPath)) {
    return {
      valid: false,
      migrationPath,
      issues: [
        issue(
          "error",
          "migration_missing",
          `Migration ${OWNER_PERMISSION_SEED_MIGRATION_FILE} ausente.`,
        ),
      ],
    };
  }

  const content = readFileSync(migrationPath, "utf8");
  const normalized = content.toLowerCase();
  const insertTuples = extractInsertTuples(content);

  for (const permission of REQUIRED_OWNER_SEED_PERMISSIONS) {
    if (!content.includes(permission)) {
      issues.push(
        issue("error", "permission_missing", `Permissão owner-exclusive ausente: ${permission}.`),
      );
    }
  }

  const ownerExclusiveInserts = insertTuples.filter((row) =>
    (REQUIRED_OWNER_SEED_PERMISSIONS as readonly string[]).includes(row.permission),
  );

  if (ownerExclusiveInserts.length < REQUIRED_OWNER_SEED_PERMISSIONS.length) {
    issues.push(
      issue(
        "error",
        "seed_incomplete",
        `INSERT incompleto — esperado ${REQUIRED_OWNER_SEED_PERMISSIONS.length} rows owner, encontrado ${ownerExclusiveInserts.length}.`,
      ),
    );
  }

  for (const row of ownerExclusiveInserts) {
    if (row.role !== "owner") {
      issues.push(
        issue(
          "error",
          "non_owner_grant",
          `Permissão ${row.permission} associada a role ${row.role} no INSERT.`,
        ),
      );
    }
  }

  for (const permission of REQUIRED_OWNER_SEED_PERMISSIONS) {
    for (const role of NON_OWNER_ROLES) {
      const pattern = new RegExp(
        `\\(\\s*'${role}'\\s*,\\s*'${permission.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}'`,
        "i",
      );
      if (pattern.test(content)) {
        issues.push(
          issue(
            "error",
            "admin_or_lower_grant",
            `${role} recebe permissão owner-exclusive ${permission}.`,
          ),
        );
      }
    }
  }

  if (!normalized.includes("on conflict (role, permission)")) {
    issues.push(
      issue("error", "not_idempotent", "Migration não usa ON CONFLICT (role, permission)."),
    );
  }

  if (!normalized.includes("do update") && !normalized.includes("do nothing")) {
    issues.push(
      issue("warning", "conflict_handler_missing", "Handler ON CONFLICT não evidente."),
    );
  }

  if (!content.includes("role <> 'owner'") && !content.includes('role <> \'owner\'')) {
    issues.push(
      issue(
        "warning",
        "cleanup_missing",
        "DELETE defensivo para non-owner grants não encontrado.",
      ),
    );
  }

  const permissiveAnonPatterns = [
    /to\s+anon[\s\S]*?using\s*\(\s*true\s*\)/i,
    /^\s*grant\s+/im,
    /for\s+all[\s\S]*?to\s+anon[\s\S]*?using\s*\(\s*true\s*\)/i,
  ];

  for (const pattern of permissiveAnonPatterns) {
    if (pattern.test(content)) {
      issues.push(
        issue("error", "anon_grant", "Grant ou policy permissiva para anon detectada."),
      );
    }
  }

  if (normalized.includes("drop policy") || normalized.includes("alter policy")) {
    issues.push(
      issue("warning", "rls_modified", "Migration altera policies RLS — revisar manualmente."),
    );
  }

  const hasErrors = issues.some((item) => item.severity === "error");

  return {
    valid: !hasErrors,
    migrationPath,
    issues,
  };
}
