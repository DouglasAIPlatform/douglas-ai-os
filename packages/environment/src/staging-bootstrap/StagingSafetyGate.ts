import type { StagingReadinessCheckResult } from "./StagingReadinessReport";
import { STAGING_TARGET_MANIFEST } from "./StagingTargetManifest";
import { getStagingEnvironmentProfile } from "./StagingEnvironmentProfile";

export type StagingSafetyCheckOutcome = "pass" | "fail" | "pending" | "skip";

export interface StagingSafetyCheck {
  id: string;
  label: string;
  outcome: StagingSafetyCheckOutcome;
  message: string;
  blocking: boolean;
}

export interface StagingSafetyGateInput {
  effectiveEnvironment: string;
  supabaseConfigured: boolean;
  dosEnvironmentExplicit: boolean;
  mocksAllowed: boolean;
  mockRoleAllowed: boolean;
  missionPersistenceMode?: string;
  migrationsSyncKnown?: boolean;
  edgeFunctionDeployed?: boolean;
  auditIngestAuthRequired?: boolean;
  activeProfile?: boolean;
  realAuth?: boolean;
  acceptanceReportApproved?: boolean;
}

function check(
  id: string,
  label: string,
  outcome: StagingSafetyCheckOutcome,
  message: string,
  blocking = true,
): StagingSafetyCheck {
  return { id, label, outcome, message, blocking };
}

/** Checks de política staging — desconhecido nunca conta como aprovado. */
export function evaluateStagingSafetyGate(
  input: StagingSafetyGateInput,
): StagingSafetyCheck[] {
  const profile = getStagingEnvironmentProfile();
  const isStaging = input.effectiveEnvironment === "staging";
  const checks: StagingSafetyCheck[] = [];

  checks.push(
    check(
      "separate_supabase_project",
      "Projeto Supabase separado",
      isStaging && STAGING_TARGET_MANIFEST.requireSeparateSupabaseProject
        ? input.supabaseConfigured
          ? "pass"
          : "pending"
        : "skip",
      isStaging
        ? input.supabaseConfigured
          ? "Variáveis Supabase configuradas (projeto dedicado esperado)."
          : "Configure projeto Supabase staging separado."
        : "Aplicável somente em staging.",
      isStaging,
    ),
  );

  checks.push(
    check(
      "explicit_staging_environment",
      "Ambiente explicitamente staging",
      isStaging
        ? input.dosEnvironmentExplicit
          ? "pass"
          : "fail"
        : "skip",
      isStaging
        ? input.dosEnvironmentExplicit
          ? "NEXT_PUBLIC_DOS_ENVIRONMENT=staging."
          : "Staging exige declaração explícita do ambiente."
        : "N/A fora de staging.",
      isStaging,
    ),
  );

  checks.push(
    check(
      "mocks_disabled",
      "Mocks desativados",
      isStaging ? (input.mocksAllowed ? "fail" : "pass") : "skip",
      isStaging
        ? input.mocksAllowed
          ? "Mocks não permitidos em staging."
          : "Mocks desligados."
        : "N/A.",
      isStaging,
    ),
  );

  checks.push(
    check(
      "mock_role_locked",
      "Mock role bloqueada",
      isStaging ? (input.mockRoleAllowed ? "fail" : "pass") : "skip",
      isStaging
        ? input.mockRoleAllowed
          ? "Mock role bloqueada em staging."
          : "Troca de mock role bloqueada."
        : "N/A.",
      isStaging,
    ),
  );

  checks.push(
    check(
      "supabase_required_persistence",
      "Persistência supabase_required",
      isStaging
        ? input.missionPersistenceMode === "supabase_required"
          ? "pass"
          : input.missionPersistenceMode === undefined
            ? "pending"
            : "fail"
        : "skip",
      isStaging
        ? input.missionPersistenceMode === "supabase_required"
          ? "Mission persistence exige Supabase."
          : "Staging exige supabase_required — não session fallback."
        : "N/A.",
      isStaging,
    ),
  );

  checks.push(
    check(
      "audit_ingest_auth_required",
      "AUDIT_INGEST_AUTH_MODE=required",
      isStaging
        ? input.auditIngestAuthRequired === true
          ? "pass"
          : input.auditIngestAuthRequired === false
            ? "fail"
            : "pending"
        : "skip",
      isStaging
        ? input.auditIngestAuthRequired === true
          ? "Auth required configurado no remoto."
          : "Configure via Supabase secrets."
        : "N/A.",
      isStaging,
    ),
  );

  checks.push(
    check(
      "active_operator_profile",
      "Profile real ativo",
      isStaging
        ? input.activeProfile === true
          ? "pass"
          : input.activeProfile === false
            ? "fail"
            : "pending"
        : "skip",
      isStaging ? "operator_profile active necessário." : "N/A.",
      isStaging,
    ),
  );

  checks.push(
    check(
      "migrations_synchronized",
      "Migrations sincronizadas",
      isStaging
        ? input.migrationsSyncKnown === true
          ? "pass"
          : input.migrationsSyncKnown === false
            ? "fail"
            : "pending"
        : "skip",
      isStaging ? "Migrations aplicadas no projeto staging." : "N/A.",
      isStaging,
    ),
  );

  checks.push(
    check(
      "edge_function_validated",
      "Edge Function validada",
      isStaging
        ? input.edgeFunctionDeployed === true
          ? "pass"
          : input.edgeFunctionDeployed === false
            ? "fail"
            : "pending"
        : "skip",
      isStaging ? "audit-ingest deployada e respondendo." : "N/A.",
      isStaging,
    ),
  );

  checks.push(
    check(
      "acceptance_report_approved",
      "Acceptance report aprovado",
      isStaging
        ? input.acceptanceReportApproved === true
          ? "pass"
          : input.acceptanceReportApproved === false
            ? "fail"
            : "pending"
        : "skip",
      isStaging ? "staging:check + revisão humana concluídos." : "N/A.",
      isStaging,
    ),
  );

  if (!profile.requireSeparateSupabaseProject) {
    checks.push(
      check(
        "profile_integrity",
        "Perfil staging íntegro",
        "fail",
        "requireSeparateSupabaseProject deve ser true.",
        true,
      ),
    );
  }

  return checks;
}

export function stagingSafetyChecksToReadiness(
  safetyChecks: StagingSafetyCheck[],
): StagingReadinessCheckResult[] {
  return safetyChecks
    .filter((item) => item.outcome !== "skip")
    .map((item) => ({
      id: "release_readiness_approved" as StagingReadinessCheckResult["id"],
      label: item.label,
      outcome:
        item.outcome === "pass"
          ? "pass"
          : item.outcome === "pending"
            ? "pending_runtime"
            : "fail",
      message: item.message,
      scope: "runtime" as const,
      blocking: item.blocking,
    }));
}
