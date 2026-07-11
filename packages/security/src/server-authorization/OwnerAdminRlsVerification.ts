import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const OWNER_ADMIN_RLS_MIGRATION_FILE =
  "20250710200000_owner_admin_rls_separation.sql";

export const REQUIRED_OWNER_ADMIN_RLS_HELPERS = [
  "can_promote_to_owner",
  "can_manage_operational_roles",
  "is_active_admin_operator",
  "require_active_operator",
  "operator_has_permission",
] as const;

export interface OwnerAdminRlsVerificationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
}

export interface OwnerAdminRlsVerificationReport {
  valid: boolean;
  migrationPath: string;
  issues: OwnerAdminRlsVerificationIssue[];
}

function issue(
  severity: OwnerAdminRlsVerificationIssue["severity"],
  code: string,
  message: string,
): OwnerAdminRlsVerificationIssue {
  return { severity, code, message };
}

function extractPolicyBlocks(content: string): string[] {
  const blocks: string[] = [];
  const pattern = /CREATE POLICY\s+"[^"]+"[\s\S]*?;/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    blocks.push(match[0]);
  }
  return blocks;
}

export function verifyOwnerAdminRlsMigrationSql(
  repoRoot: string,
): OwnerAdminRlsVerificationReport {
  const migrationPath = join(
    repoRoot,
    "supabase",
    "migrations",
    OWNER_ADMIN_RLS_MIGRATION_FILE,
  );
  const issues: OwnerAdminRlsVerificationIssue[] = [];

  if (!existsSync(migrationPath)) {
    return {
      valid: false,
      migrationPath,
      issues: [
        issue(
          "error",
          "migration_missing",
          `Migration ${OWNER_ADMIN_RLS_MIGRATION_FILE} ausente.`,
        ),
      ],
    };
  }

  const content = readFileSync(migrationPath, "utf8");
  const normalized = content.toLowerCase();
  const policyBlocks = extractPolicyBlocks(content);

  for (const helper of REQUIRED_OWNER_ADMIN_RLS_HELPERS) {
    if (!content.includes(helper)) {
      issues.push(issue("error", "helper_missing", `Referência ausente: ${helper}`));
    }
  }

  const ownerExclusiveGrouped = /has_platform_role\s*\(\s*ARRAY\s*\[\s*'owner'\s*,\s*'admin'\s*\]\s*\)/gi;
  if (ownerExclusiveGrouped.test(content)) {
    issues.push(
      issue(
        "error",
        "owner_admin_grouped",
        "has_platform_role(ARRAY['owner','admin']) ainda presente — separação incompleta.",
      ),
    );
  }

  const adminMutatingPolicies = policyBlocks.filter(
    (block) =>
      /operator_profiles_insert_admin|operator_profiles_update_admin/i.test(block),
  );

  for (const block of adminMutatingPolicies) {
    if (!/require_active_operator|is_active_admin_operator/i.test(block)) {
      issues.push(
        issue(
          "error",
          "admin_inactive_allowed",
          "Policy admin de operator_profiles sem exigência de profile active.",
        ),
      );
    }
    if (!/(?:^|\W)role\s+in\s*\(|operator_profiles\.role\s+in\s*\(/i.test(block)) {
      issues.push(
        issue(
          "error",
          "admin_can_promote_owner",
          "Policy admin não restringe role a operator/viewer.",
        ),
      );
    }
    if (/(?:^|\W)role\s*=\s*'owner'|role\s*=\s*'owner'::/i.test(block)) {
      issues.push(
        issue(
          "error",
          "admin_owner_role_grant",
          "Policy admin permite role owner.",
        ),
      );
    }
  }

  const ownerInsert = policyBlocks.find((b) => b.includes("operator_profiles_insert_owner"));
  if (!ownerInsert || !/can_promote_to_owner|security:manage_owners/i.test(ownerInsert)) {
    issues.push(
      issue(
        "error",
        "owner_promote_guard_missing",
        "INSERT owner sem can_promote_to_owner / security:manage_owners.",
      ),
    );
  }

  if (!/can_read_full_audit_log/i.test(content)) {
    issues.push(
      issue("warning", "audit_helper_missing", "can_read_full_audit_log não atualizado."),
    );
  }

  if (/using\s*\(\s*true\s*\)/i.test(content) || /with check\s*\(\s*true\s*\)/i.test(content)) {
    issues.push(
      issue("error", "permissive_policy", "Policy permissiva USING/WITH CHECK (true) detectada."),
    );
  }

  const permissiveAnonPatterns = [
    /to\s+anon[\s\S]*?using\s*\(\s*true\s*\)/i,
    /for\s+all[\s\S]*?to\s+anon[\s\S]*?using\s*\(\s*true\s*\)/i,
    /grant\s+[\s\S]*?\s+to\s+anon\b/i,
  ];

  for (const pattern of permissiveAnonPatterns) {
    if (pattern.test(content)) {
      issues.push(issue("error", "anon_grant", "Grant ou policy permissiva para anon."));
    }
  }

  if (!content.includes("audit_entries_insert_denied") && !normalized.includes("with check (false)")) {
    issues.push(
      issue(
        "warning",
        "audit_insert_not_referenced",
        "Migration não referencia negação de INSERT em audit (preservada em migrations anteriores).",
      ),
    );
  }

  const hasErrors = issues.some((item) => item.severity === "error");

  return {
    valid: !hasErrors,
    migrationPath,
    issues,
  };
}

export function verifyAuditInsertStillDenied(repoRoot: string): boolean {
  const auditMigration = join(
    repoRoot,
    "supabase",
    "migrations",
    "20250707130002_operational_audit_entries.sql",
  );
  if (!existsSync(auditMigration)) {
    return false;
  }
  const content = readFileSync(auditMigration, "utf8");
  return (
    content.includes("audit_entries_insert_denied_authenticated") &&
    content.includes("WITH CHECK (false)")
  );
}
