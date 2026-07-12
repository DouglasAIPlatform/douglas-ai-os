import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildStagingReadinessReport,
  formatStagingReadinessReport,
  type StagingReadinessCheckResult,
  type StagingReadinessReport,
} from "./StagingReadinessReport.ts";
import { buildStagingConfigurationSnapshot } from "./StagingConfigurationSnapshot.ts";

const STAGING_POLICY = {
  allowMocks: false,
  allowMockRoleChange: false,
  requireRealAuth: true,
  requireAuthProfile: true,
} as const;

export const STAGING_BOOTSTRAP_DOCS = [
  "docs/operations/staging-bootstrap.md",
  "docs/operations/staging-validation-checklist.md",
  "docs/operations/staging-production-environments.md",
] as const;

export const EXPECTED_STAGING_MIGRATIONS = [
  "20250707130000_platform_helpers.sql",
  "20250707130001_operator_profiles.sql",
  "20250707130002_operational_audit_entries.sql",
  "20250707130003_operator_sessions.sql",
  "20250710180000_server_rbac_enforcement.sql",
  "20250710190000_owner_permission_seed.sql",
  "20250710200000_owner_admin_rls_separation.sql",
] as const;

function fileContains(path: string, pattern: string | RegExp): boolean {
  if (!existsSync(path)) {
    return false;
  }
  const content = readFileSync(path, "utf8");
  return typeof pattern === "string" ? content.includes(pattern) : pattern.test(content);
}

function staticCheck(
  id: StagingReadinessCheckResult["id"],
  label: string,
  pass: boolean,
  passMessage: string,
  failMessage: string,
): StagingReadinessCheckResult {
  return {
    id,
    label,
    outcome: pass ? "pass" : "fail",
    message: pass ? passMessage : failMessage,
    scope: "static",
    blocking: true,
  };
}

function verifyStaticRepoArtifacts(repoRoot: string): string[] {
  const issues: string[] = [];

  const profilePath = join(repoRoot, "packages/environment/src/EnvironmentProfile.ts");
  if (
    !fileContains(profilePath, "staging:") ||
    !fileContains(profilePath, "allowMocks: false") ||
    !fileContains(profilePath, "requireEdgeFunctionAudit: true")
  ) {
    issues.push("EnvironmentProfile staging incompleto.");
  }

  const auditConfigPath = join(
    repoRoot,
    "apps/headquarters/features/platform-audit/config.ts",
  );
  if (!fileContains(auditConfigPath, 'writeMode: "edge_function"')) {
    issues.push("auditSupabaseConfig.writeMode deve ser edge_function.");
  }

  for (const migration of EXPECTED_STAGING_MIGRATIONS) {
    if (!existsSync(join(repoRoot, "supabase/migrations", migration))) {
      issues.push(`Migration ausente: ${migration}`);
    }
  }

  for (const doc of STAGING_BOOTSTRAP_DOCS) {
    if (!existsSync(join(repoRoot, doc))) {
      issues.push(`Documento ausente: ${doc}`);
    }
  }

  const envExamplePath = join(repoRoot, ".env.example");
  if (
    !fileContains(envExamplePath, "NEXT_PUBLIC_DOS_ENVIRONMENT") ||
    !fileContains(envExamplePath, "staging")
  ) {
    issues.push(".env.example não documenta staging.");
  }

  if (!fileContains(join(repoRoot, "package.json"), "staging:check")) {
    issues.push("Script staging:check ausente em package.json.");
  }

  const stagingProfilePath = join(
    repoRoot,
    "packages/environment/src/staging-bootstrap/StagingEnvironmentProfile.ts",
  );
  if (!existsSync(stagingProfilePath)) {
    issues.push("StagingEnvironmentProfile ausente.");
  }

  return issues;
}

export function runStagingReadinessCheck(
  repoRoot: string,
  options: { env?: NodeJS.ProcessEnv } = {},
): StagingReadinessReport {
  const env = options.env ?? process.env;
  const rawDos = env.NEXT_PUBLIC_DOS_ENVIRONMENT?.trim() ?? "";
  const effectiveEnvironment: "development" | "staging" | "production" =
    rawDos === "staging" || rawDos === "production" || rawDos === "development"
      ? rawDos
      : "development";
  const declaredExplicitly = rawDos.length > 0;
  const isStaging = effectiveEnvironment === "staging";

  const supabaseUrlConfigured = Boolean(env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKeyConfigured = Boolean(
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY && env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 20,
  );

  const profile = STAGING_POLICY;
  const staticIssues = verifyStaticRepoArtifacts(repoRoot);

  const snapshot = buildStagingConfigurationSnapshot({
    effectiveEnvironment,
    stagingDeclared: isStaging,
    supabaseUrlConfigured,
    anonKeyConfigured,
    mocksBlocked: !profile.allowMocks,
    mockRoleBlocked: !profile.allowMockRoleChange,
    realAuthRequired: profile.requireRealAuth,
    activeProfileRequired: profile.requireAuthProfile,
    auditWriteModeEdgeFunction: true,
    serverRbacExpected: staticIssues.every((item) => !item.startsWith("Migration")),
    migrationsSyncKnown: false,
    declaredExplicitly,
    hasCriticalMismatch: false,
  });

  const checks: StagingReadinessCheckResult[] = [
    staticCheck(
      "mocks_blocked",
      "Mocks desligados em staging",
      profile.allowMocks === false,
      "Política staging bloqueia mocks.",
      "Mocks permitidos — inválido para staging.",
    ),
    staticCheck(
      "mock_role_blocked",
      "Troca de mock role bloqueada",
      profile.allowMockRoleChange === false,
      "Troca de mock role bloqueada.",
      "Mock role permitido — inválido para staging.",
    ),
    staticCheck(
      "real_auth_required",
      "Login real exigido pela política",
      profile.requireRealAuth && profile.requireAuthProfile,
      "Login real e profile exigidos.",
      "Política staging incompleta.",
    ),
    staticCheck(
      "audit_edge_function",
      "writeMode edge_function para audit",
      fileContains(
        join(repoRoot, "apps/headquarters/features/platform-audit/config.ts"),
        'writeMode: "edge_function"',
      ),
      "Audit writeMode = edge_function.",
      "Audit deve usar edge_function.",
    ),
    staticCheck(
      "migrations_documented",
      "Migrations esperadas documentadas",
      EXPECTED_STAGING_MIGRATIONS.every((file) =>
        existsSync(join(repoRoot, "supabase/migrations", file)),
      ),
      "Migrations documentadas presentes.",
      "Migrations RBAC ausentes.",
    ),
    staticCheck(
      "server_rbac_expected",
      "RBAC server-side esperado",
      existsSync(
        join(repoRoot, "supabase/migrations/20250710180000_server_rbac_enforcement.sql"),
      ),
      "Migration RBAC server-side presente.",
      "Migration RBAC ausente.",
    ),
    {
      id: "environment_is_staging",
      label: "Ambiente efetivo = staging",
      outcome: isStaging ? "pass" : "warn",
      message: isStaging
        ? "Ambiente efetivo é staging."
        : "Ambiente atual não é staging — checks estáticos OK para codebase.",
      scope: "static",
      blocking: false,
    },
    {
      id: "supabase_configured",
      label: "Supabase configurado",
      outcome: snapshot.supabaseConfigured ? "pass" : isStaging ? "fail" : "warn",
      message: snapshot.supabaseConfigured
        ? "Variáveis Supabase presentes (valores não exibidos)."
        : "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      scope: "static",
      blocking: isStaging,
    },
    {
      id: "auth_api_available",
      label: "Auth API disponível",
      outcome: "pending_runtime",
      message: "Confirmar em runtime após deploy staging.",
      scope: "runtime",
      blocking: false,
    },
    {
      id: "real_session",
      label: "Sessão autenticada real",
      outcome: "pending_runtime",
      message: "Confirmar login real no HQ staging.",
      scope: "runtime",
      blocking: false,
    },
    {
      id: "active_profile",
      label: "operator_profile ativo",
      outcome: "pending_runtime",
      message: "Confirmar profile active no projeto staging.",
      scope: "runtime",
      blocking: false,
    },
    {
      id: "audit_ingest_auth_required",
      label: "AUDIT_INGEST_AUTH_MODE=required",
      outcome: "pending_runtime",
      message: "Configurar via Supabase secrets no projeto staging.",
      scope: "runtime",
      blocking: false,
    },
    {
      id: "release_readiness_approved",
      label: "Release readiness aprovado",
      outcome: "pending_runtime",
      message: "Execute pnpm release:check antes de promover.",
      scope: "runtime",
      blocking: false,
    },
  ];

  const blockers = [...staticIssues];
  const blockingChecks = checks.filter((item) => item.outcome === "fail" && item.blocking);

  for (const item of blockingChecks) {
    blockers.push(item.message);
  }

  return buildStagingReadinessReport({
    snapshot,
    checks,
    blockers,
    nextSteps: isStaging
      ? [
          "Aplique migrations manualmente no projeto staging.",
          "Deploy manual da Edge Function audit-ingest.",
          "Configure AUDIT_INGEST_AUTH_MODE=required via Supabase secrets.",
          "Valide via StagingReadinessWidget e Production Safety Gate.",
        ]
      : [
          "Para bootstrap: NEXT_PUBLIC_DOS_ENVIRONMENT=staging + projeto Supabase separado.",
          "Execute pnpm staging:check após configurar variáveis.",
        ],
  });
}

export function runAndFormatStagingReadinessCheck(
  repoRoot: string,
  options: { env?: NodeJS.ProcessEnv } = {},
): { report: StagingReadinessReport; formatted: string } {
  const report = runStagingReadinessCheck(repoRoot, options);
  return {
    report,
    formatted: formatStagingReadinessReport(report),
  };
}
