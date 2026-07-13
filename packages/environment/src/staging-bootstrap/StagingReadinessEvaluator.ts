import { resolveEnvironmentConfig } from "../EnvironmentConfigResolver";
import { getStagingEnvironmentProfile } from "./StagingEnvironmentProfile";
import { buildStagingConfigurationSnapshot } from "./StagingConfigurationSnapshot";
import {
  buildStagingReadinessReport,
  type StagingReadinessCheckResult,
  type StagingReadinessReport,
} from "./StagingReadinessReport";
import { resolveStagingReadinessDimensions } from "./StagingReadinessDimensions";
import { evaluateStagingSafetyGate } from "./StagingSafetyGate";
import {
  STAGING_READINESS_REQUIREMENTS,
  type StagingReadinessRequirementId,
} from "./StagingReadinessRequirement";

export interface StagingRuntimeContext {
  userAuthenticated?: boolean;
  hasActiveProfile?: boolean;
  isUsingMockOperator?: boolean;
  hasCriticalMismatch?: boolean;
  auditWriteMode?: string | null;
  migrationsSyncKnown?: boolean;
  serverRbacExpected?: boolean;
  releaseReadinessApproved?: boolean;
  authApiAvailable?: boolean;
  lastAuditAccepted?: boolean;
  pendingQueueControlled?: boolean;
  auditIngestAuthRequired?: boolean;
  edgeFunctionDeployed?: boolean;
  remoteMissionPersistence?: boolean;
  remoteMissionPersistenceKnown?: boolean;
  persistenceFallbackActive?: boolean;
  humanReviewApproved?: boolean;
  missionPersistenceMode?: string;
}

export interface EvaluateStagingReadinessInput {
  env?: NodeJS.ProcessEnv;
  supabaseUrlConfigured?: boolean;
  anonKeyConfigured?: boolean;
  runtime?: StagingRuntimeContext;
}

function checkResult(
  id: StagingReadinessRequirementId,
  outcome: StagingReadinessCheckResult["outcome"],
  message: string,
  blocking: boolean,
): StagingReadinessCheckResult {
  const requirement = STAGING_READINESS_REQUIREMENTS.find((item) => item.id === id)!;
  return {
    id,
    label: requirement.label,
    outcome,
    message,
    scope: requirement.scope,
    blocking,
  };
}

export function evaluateStagingReadiness(
  input: EvaluateStagingReadinessInput = {},
): StagingReadinessReport {
  const env = input.env ?? process.env;
  const profile = getStagingEnvironmentProfile();
  const config = resolveEnvironmentConfig({ env });
  const runtime = input.runtime ?? {};

  const supabaseUrlConfigured =
    input.supabaseUrlConfigured ??
    Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_URL.length > 0);
  const anonKeyConfigured =
    input.anonKeyConfigured ??
    Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY && env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 20);

  const auditWriteMode = runtime.auditWriteMode ?? "edge_function";
  const isStaging = config.name === "staging";

  const snapshot = buildStagingConfigurationSnapshot({
    effectiveEnvironment: config.name,
    stagingDeclared: isStaging,
    supabaseUrlConfigured,
    anonKeyConfigured,
    mocksBlocked: !profile.allowMocks,
    mockRoleBlocked: !profile.allowMockRoleChange,
    realAuthRequired: profile.requireRealAuth,
    activeProfileRequired: profile.requireAuthProfile,
    auditWriteModeEdgeFunction: auditWriteMode === "edge_function",
    serverRbacExpected: runtime.serverRbacExpected ?? true,
    migrationsSyncKnown: runtime.migrationsSyncKnown ?? false,
    declaredExplicitly: config.declaredExplicitly,
    hasCriticalMismatch: runtime.hasCriticalMismatch ?? false,
  });

  const checks: StagingReadinessCheckResult[] = [];

  checks.push(
    checkResult(
      "dos_environment_explicit",
      config.declaredExplicitly ? "pass" : "warn",
      config.declaredExplicitly
        ? "NEXT_PUBLIC_DOS_ENVIRONMENT declarado."
        : "Ambiente em default development — OK para local.",
      false,
    ),
  );

  checks.push(
    checkResult(
      "environment_is_staging",
      isStaging ? "pass" : "warn",
      isStaging
        ? "Ambiente efetivo é staging."
        : "Ambiente atual não é staging — checks informativos.",
      false,
    ),
  );

  checks.push(
    checkResult(
      "supabase_configured",
      snapshot.supabaseConfigured ? "pass" : isStaging ? "fail" : "warn",
      snapshot.supabaseConfigured
        ? "Variáveis Supabase presentes (valores não exibidos)."
        : "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      isStaging,
    ),
  );

  checks.push(
    checkResult(
      "mocks_blocked",
      snapshot.mocksBlocked ? "pass" : "fail",
      snapshot.mocksBlocked
        ? "Política staging bloqueia mocks."
        : "Mocks permitidos — inválido para staging.",
      true,
    ),
  );

  checks.push(
    checkResult(
      "mock_role_blocked",
      snapshot.mockRoleBlocked ? "pass" : "fail",
      snapshot.mockRoleBlocked
        ? "Troca de mock role bloqueada em staging."
        : "Mock role permitido — inválido para staging.",
      true,
    ),
  );

  checks.push(
    checkResult(
      "real_auth_required",
      snapshot.realAuthRequired ? "pass" : "fail",
      snapshot.realAuthRequired
        ? "Login real exigido pela política staging."
        : "Política não exige auth real.",
      true,
    ),
  );

  checks.push(
    checkResult(
      "audit_edge_function",
      snapshot.auditWriteModeEdgeFunction ? "pass" : "fail",
      snapshot.auditWriteModeEdgeFunction
        ? "Audit writeMode = edge_function."
        : "Audit deve usar edge_function em staging.",
      true,
    ),
  );

  checks.push(
    checkResult(
      "migrations_documented",
      snapshot.serverRbacExpected ? "pass" : "fail",
      "Migrations RBAC documentadas na codebase.",
      true,
    ),
  );

  checks.push(
    checkResult(
      "server_rbac_expected",
      snapshot.serverRbacExpected ? "pass" : "fail",
      "RBAC server-side esperado após apply manual das migrations.",
      true,
    ),
  );

  const runtimeChecks: Array<{
    id: StagingReadinessRequirementId;
    known: boolean;
    pass: boolean;
    passMessage: string;
    failMessage: string;
  }> = [
    {
      id: "auth_api_available",
      known: runtime.authApiAvailable !== undefined,
      pass: runtime.authApiAvailable === true,
      passMessage: "Auth API disponível.",
      failMessage: "Auth API indisponível.",
    },
    {
      id: "real_session",
      known: runtime.userAuthenticated !== undefined,
      pass: runtime.userAuthenticated === true,
      passMessage: "Sessão autenticada.",
      failMessage: "Login real necessário.",
    },
    {
      id: "active_profile",
      known: runtime.hasActiveProfile !== undefined,
      pass: runtime.hasActiveProfile === true,
      passMessage: "operator_profile ativo.",
      failMessage: "Profile ativo necessário.",
    },
    {
      id: "role_not_mock",
      known: runtime.isUsingMockOperator !== undefined,
      pass: runtime.isUsingMockOperator === false,
      passMessage: "Role efetiva não é mock.",
      failMessage: "Operador mock detectado.",
    },
    {
      id: "audit_ingest_auth_required",
      known: runtime.auditIngestAuthRequired !== undefined,
      pass: runtime.auditIngestAuthRequired === true,
      passMessage: "AUDIT_INGEST_AUTH_MODE=required no remoto.",
      failMessage: "Configure AUDIT_INGEST_AUTH_MODE=required via Supabase secrets.",
    },
    {
      id: "last_audit_accepted",
      known: runtime.lastAuditAccepted !== undefined,
      pass: runtime.lastAuditAccepted === true,
      passMessage: "Último audit remoto accepted.",
      failMessage: "Audit remoto pendente ou rejeitado.",
    },
    {
      id: "pending_queue_controlled",
      known: runtime.pendingQueueControlled !== undefined,
      pass: runtime.pendingQueueControlled === true,
      passMessage: "Fila de pendências controlada.",
      failMessage: "Fila de audit acima do limite.",
    },
    {
      id: "no_critical_environment_mismatch",
      known: runtime.hasCriticalMismatch !== undefined,
      pass: runtime.hasCriticalMismatch === false,
      passMessage: "Sem mismatch crítico de ambiente.",
      failMessage: "Mismatch crítico detectado.",
    },
    {
      id: "release_readiness_approved",
      known: runtime.releaseReadinessApproved !== undefined,
      pass: runtime.releaseReadinessApproved === true,
      passMessage: "Release readiness aprovado.",
      failMessage: "Execute pnpm release:check antes de promover.",
    },
  ];

  for (const item of runtimeChecks) {
    if (!item.known) {
      checks.push(
        checkResult(
          item.id,
          "pending_runtime",
          "Confirmar em runtime (HQ widget ou ambiente staging deployado).",
          false,
        ),
      );
      continue;
    }

    checks.push(
      checkResult(
        item.id,
        item.pass ? "pass" : isStaging ? "fail" : "warn",
        item.pass ? item.passMessage : item.failMessage,
        isStaging,
      ),
    );
  }

  const nextSteps: string[] = [];

  if (!isStaging) {
    nextSteps.push(
      "Para bootstrap staging: defina NEXT_PUBLIC_DOS_ENVIRONMENT=staging na Vercel ou .env.local.",
    );
    nextSteps.push("Use projeto Supabase separado de production.");
  } else {
    if (!snapshot.supabaseConfigured) {
      nextSteps.push("Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }
    nextSteps.push("Aplique migrations manualmente no projeto staging.");
    nextSteps.push("Deploy manual da Edge Function audit-ingest.");
    nextSteps.push("Configure AUDIT_INGEST_AUTH_MODE=required via Supabase secrets.");
    nextSteps.push("Valide runtime via Production Safety Gate e StagingReadinessWidget.");
    nextSteps.push("Promova para production somente após revisão humana.");
  }

  const alerts: string[] = [];
  if (profile.treatLocalAuditFallbackAsWarning && isStaging) {
    alerts.push("Fallback local de audit deve ser tratado como alerta em staging.");
  }

  const safetyChecks = evaluateStagingSafetyGate({
    effectiveEnvironment: config.name,
    supabaseConfigured: snapshot.supabaseConfigured,
    dosEnvironmentExplicit: config.declaredExplicitly,
    mocksAllowed: profile.allowMocks,
    mockRoleAllowed: profile.allowMockRoleChange,
    missionPersistenceMode: runtime.missionPersistenceMode,
    migrationsSyncKnown: runtime.migrationsSyncKnown,
    edgeFunctionDeployed: runtime.edgeFunctionDeployed,
    auditIngestAuthRequired: runtime.auditIngestAuthRequired,
    activeProfile: runtime.hasActiveProfile,
    realAuth: runtime.userAuthenticated,
    acceptanceReportApproved: runtime.humanReviewApproved,
  });

  const dimensions = resolveStagingReadinessDimensions({
    snapshot,
    checks,
    runtime,
    codebasePrepared: true,
    envTemplatesPresent: true,
  });

  if (dimensions.finalStatus !== "ready") {
    nextSteps.unshift("Execute pnpm staging:bootstrap-plan para o roteiro manual completo.");
  }

  return buildStagingReadinessReport({
    snapshot,
    checks,
    dimensions,
    alerts,
    nextSteps,
    safetyChecks,
  });
}
