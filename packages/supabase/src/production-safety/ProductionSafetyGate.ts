import type { SupabaseClient } from "@supabase/supabase-js";
import type { EnvironmentGateSnapshot } from "@douglas/environment";
import type { SupabaseConfig } from "../SupabaseConfig";
import type { SupabaseConnectionState } from "../SupabaseConnectionStatus";
import type { SupabaseEnvironment } from "../SupabaseEnvironment";
import { runSupabaseHealthCheck, type SupabaseHealthCheckOptions } from "../SupabaseHealthCheck";
import { SUPABASE_TABLES } from "../schema";
import { probeSupabaseTableReadOnly } from "../staging-validation/probeSupabaseTableReadOnly";
import type { StagingValidationAuditSnapshot, StagingValidationEdgeSnapshot } from "../staging-validation/SupabaseStagingValidation";
import {
  PRODUCTION_SAFETY_CHECK_LABELS,
  PRODUCTION_SAFETY_INGEST_CRITICAL_FAILURE_RATE,
  PRODUCTION_SAFETY_INGEST_MIN_ATTEMPTS,
  PRODUCTION_SAFETY_PENDING_QUEUE_LIMIT,
  type ProductionSafetyCheck,
  type ProductionSafetyCheckId,
} from "./ProductionSafetyCheck";
import {
  buildProductionSafetyReport,
  partitionProductionSafetyChecks,
  type ProductionSafetyReport,
} from "./ProductionSafetyReport";
import type { ProductionSafetyStatus } from "./ProductionSafetyStatus";

export interface ProductionSafetyAuthSnapshot {
  status: string;
  mode: string;
  hasProfile: boolean;
  isLoading: boolean;
  isUsingMockOperator: boolean;
  effectiveRole: string;
  operatorSource: string;
  mockRoleChangeAllowed: boolean;
  profileRole: string | null;
  profileStatus: string | null;
}

export interface ProductionSafetyAuditSnapshot extends StagingValidationAuditSnapshot {
  lastRemoteStatus?: "accepted" | "rejected" | "error" | null;
  lastRemoteErrorCode?: string | null;
  pendingQueueTotal?: number;
  pendingQueueFailed?: number;
  pendingQueueError?: string | null;
  ingestTotalAttempts?: number;
  ingestAccepted?: number;
  ingestRejected?: number;
  ingestFailed?: number;
  ingestLastErrorCode?: string | null;
  ingestLastOutcome?: string | null;
}

export interface RunProductionSafetyGateInput {
  config: SupabaseConfig;
  client: SupabaseClient | null;
  connection: SupabaseConnectionState;
  healthCheckOptions?: SupabaseHealthCheckOptions;
  auth: ProductionSafetyAuthSnapshot;
  audit: ProductionSafetyAuditSnapshot;
  edge: StagingValidationEdgeSnapshot;
  environment: SupabaseEnvironment;
  platform?: EnvironmentGateSnapshot;
}

function check(
  id: ProductionSafetyCheckId,
  outcome: ProductionSafetyCheck["outcome"],
  message: string,
  options: { blocking?: boolean; docPath?: string } = {},
): ProductionSafetyCheck {
  return {
    id,
    label: PRODUCTION_SAFETY_CHECK_LABELS[id],
    outcome,
    message,
    blocking: options.blocking ?? false,
    docPath: options.docPath,
  };
}

function isCriticalAuditError(error: string | null | undefined): boolean {
  if (!error) {
    return false;
  }
  const normalized = error.toLowerCase();
  return (
    normalized.includes("service_role") ||
    normalized.includes("unauthorized") ||
    normalized.includes("jwt") ||
    normalized.includes("internal_error") ||
    normalized.includes("insert_failed")
  );
}

function isCriticalIngestErrorCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return (
    code === "profile_not_found" ||
    code === "role_not_allowed" ||
    code === "insert_failed" ||
    code === "internal_error" ||
    code === "invalid_token" ||
    code === "function_not_deployed"
  );
}

export function resolveProductionSafetyStatus(
  checks: ProductionSafetyCheck[],
  config: SupabaseConfig,
): ProductionSafetyStatus {
  if (checks.some((item) => item.outcome === "fail" && item.blocking)) {
    return "blocked";
  }

  if (!config.isConfigured) {
    return "not_ready";
  }

  const byId = (id: ProductionSafetyCheckId) => checks.find((item) => item.id === id);

  const configured = byId("supabase_configured");
  const tables = byId("core_tables_detected");
  const authApi = byId("auth_api_available");

  if (
    configured?.outcome === "fail" ||
    tables?.outcome === "fail" ||
    authApi?.outcome === "fail"
  ) {
    return "not_ready";
  }

  const actionable = checks.filter((item) => item.outcome !== "skip");
  const devProductionCheck = byId("platform_environment_dev_not_production_ready");
  const actionableExceptDev = actionable.filter(
    (item) => item.id !== "platform_environment_dev_not_production_ready",
  );
  const allCorePass = actionableExceptDev.every((item) => item.outcome === "pass");

  if (allCorePass && devProductionCheck?.outcome === "warn") {
    return "ready_for_staging";
  }

  const allPass = actionable.every((item) => item.outcome === "pass");

  if (allPass) {
    return "ready_for_production_review";
  }

  const hasNonBlockingFail = actionable.some((item) => item.outcome === "fail");
  const stagingCoreOk =
    configured?.outcome === "pass" &&
    tables?.outcome === "pass" &&
    authApi?.outcome === "pass";

  if (stagingCoreOk && (hasNonBlockingFail || actionable.some((item) => item.outcome === "warn"))) {
    return "ready_for_staging";
  }

  return "not_ready";
}

export function buildProductionSafetyNextSteps(
  status: ProductionSafetyStatus,
  alertChecks: ProductionSafetyCheck[],
): string[] {
  const steps: string[] = [];

  if (status === "not_ready") {
    steps.push(
      "Configure NEXT_PUBLIC_SUPABASE_URL e anon key — docs/operations/supabase-staging-validation.md.",
    );
  }

  if (status === "blocked") {
    steps.push("Corrija checks bloqueantes antes de qualquer deploy em produção.");
  }

  for (const alert of alertChecks) {
    switch (alert.id) {
      case "core_tables_detected":
        steps.push("Aplique migrations — docs/operations/apply-supabase-migrations.md.");
        break;
      case "user_authenticated":
        steps.push("Faça login em /login com conta Supabase de staging.");
        break;
      case "operator_profile_found":
      case "active_owner_present":
        steps.push(
          "Provisione owner em operator_profiles — docs/architecture/auth-operator-handoff.md.",
        );
        break;
      case "effective_role_not_mock":
        steps.push("Complete handoff auth → operator com profile real (sem RBAC mock).");
        break;
      case "audit_write_mode_edge_function":
        steps.push("Defina writeMode edge_function em auditSupabaseConfig para staging/prod.");
        break;
      case "audit_remote_status_accepted":
        steps.push(
          "Valide invoke audit-ingest — docs/architecture/audit-edge-function.md.",
        );
        break;
      case "audit_fallback_healthy":
        steps.push("Investigue fallback local — AuditTrailWidget + pending queue.");
        break;
      case "pending_queue_within_limit":
        steps.push("Execute retry/cleanup da fila pendente — docs/architecture/audit-pending-queue-cleanup.md.");
        break;
      case "edge_function_deployed":
        steps.push("Deploy manual: supabase functions deploy audit-ingest.");
        break;
      case "production_mock_role_locked":
        steps.push("Em produção, mockRoleChangeAllowed deve ser false (NODE_ENV=production).");
        break;
      case "audit_ingest_accepted_observed":
        steps.push("Gere evento audit com sessão autenticada — docs/architecture/audit-ingest-observability.md.");
        break;
      case "audit_ingest_failure_rate":
        steps.push("Investigue rejeições/falhas no Audit Ingest Observability widget.");
        break;
      case "audit_ingest_no_critical_errors":
        steps.push("Corrija auth/profile/Edge Function antes de produção.");
        break;
      case "platform_environment_declared":
        steps.push("Defina NEXT_PUBLIC_DOS_ENVIRONMENT no deploy (development/staging/production).");
        break;
      case "platform_environment_mocks_disabled":
      case "platform_environment_mock_role_locked":
        steps.push("Desligue mocks — docs/architecture/environment-separation.md.");
        break;
      case "platform_environment_auth_profile_required":
        steps.push("Complete handoff com operator_profiles real.");
        break;
      case "platform_environment_edge_function_required":
        steps.push("Configure audit writeMode edge_function para staging/production.");
        break;
      case "platform_environment_incompatible":
        steps.push("Corrija incompatibilidades de ambiente antes de promover.");
        break;
      case "platform_environment_dev_not_production_ready":
        steps.push("Development não é elegível para revisão de produção.");
        break;
      case "platform_environment_canonical_resolved":
        steps.push("Verifique NEXT_PUBLIC_DOS_ENVIRONMENT — docs/architecture/environment-resolution.md.");
        break;
      case "platform_environment_no_critical_mismatch":
        steps.push("Alinhe VERCEL_ENV e DOS antes de deploy — divergência crítica detectada.");
        break;
      case "platform_environment_production_explicit":
        steps.push("Defina NEXT_PUBLIC_DOS_ENVIRONMENT=production explicitamente para produção.");
        break;
      case "platform_environment_preview_not_production":
        steps.push("VERCEL preview não equivale a production operacional.");
        break;
      case "platform_environment_staging_production_policies":
        steps.push("Revise políticas de mocks/auth/edge para staging ou production.");
        break;
      default:
        break;
    }
  }

  if (status === "ready_for_production_review") {
    steps.push(
      "Agende revisão humana: migrations, RLS, secrets, CORS e JWT da Edge Function.",
    );
    steps.push("Este gate é diagnóstico — não substitui checklist operacional.");
  }

  if (status === "ready_for_staging") {
    steps.push("Resolva alertas restantes antes de solicitar revisão de produção.");
  }

  return [...new Set(steps)];
}

function appendPlatformEnvironmentChecks(
  checks: ProductionSafetyCheck[],
  platform: EnvironmentGateSnapshot | undefined,
  auth: ProductionSafetyAuthSnapshot,
  audit: ProductionSafetyAuditSnapshot,
  edge: StagingValidationEdgeSnapshot,
): void {
  const docPath = "docs/architecture/environment-separation.md";

  if (!platform) {
    for (const id of [
      "platform_environment_declared",
      "platform_environment_mocks_disabled",
      "platform_environment_mock_role_locked",
      "platform_environment_auth_profile_required",
      "platform_environment_edge_function_required",
      "platform_environment_incompatible",
      "platform_environment_dev_not_production_ready",
      "platform_environment_canonical_resolved",
      "platform_environment_no_critical_mismatch",
      "platform_environment_production_explicit",
      "platform_environment_preview_not_production",
      "platform_environment_staging_production_policies",
    ] as ProductionSafetyCheckId[]) {
      checks.push(check(id, "skip", "Snapshot de ambiente indisponível."));
    }
    return;
  }

  const docResolution = "docs/architecture/environment-resolution.md";

  checks.push(
    check(
      "platform_environment_canonical_resolved",
      platform.canonicalEnvironment ? "pass" : "fail",
      platform.canonicalEnvironment
        ? `Canônico: ${platform.canonicalEnvironment}.`
        : "Ambiente canônico não resolvido.",
      { blocking: !platform.canonicalEnvironment, docPath: docResolution },
    ),
  );

  checks.push(
    check(
      "platform_environment_no_critical_mismatch",
      platform.hasCriticalMismatch ? "fail" : "pass",
      platform.hasCriticalMismatch
        ? `${platform.mismatchCount} divergência(s) — inclui conflito crítico Vercel/DOS.`
        : "Nenhuma divergência crítica entre fontes.",
      { blocking: platform.hasCriticalMismatch, docPath: docResolution },
    ),
  );

  if (platform.name === "production") {
    checks.push(
      check(
        "platform_environment_production_explicit",
        platform.productionExplicitlyDeclared ? "pass" : "fail",
        platform.productionExplicitlyDeclared
          ? "Production declarado via NEXT_PUBLIC_DOS_ENVIRONMENT."
          : "Production requer declaração explícita — nunca inferido de VERCEL_ENV.",
        { blocking: !platform.productionExplicitlyDeclared, docPath: docResolution },
      ),
    );
  } else {
    checks.push(
      check(
        "platform_environment_production_explicit",
        "skip",
        "Check aplicável apenas quando ambiente canônico é production.",
      ),
    );
  }

  const previewNotProduction =
    platform.vercelEnvHint !== "preview" || platform.name !== "production";

  checks.push(
    check(
      "platform_environment_preview_not_production",
      previewNotProduction ? "pass" : "fail",
      previewNotProduction
        ? "VERCEL preview não está sendo tratado como production."
        : "VERCEL preview com DOS production — combinação inválida.",
      { blocking: !previewNotProduction, docPath: docResolution },
    ),
  );

  if (platform.name === "staging" || platform.name === "production") {
    const policiesOk =
      !platform.allowMocks &&
      !platform.allowMockRoleChange &&
      platform.requireAuthProfile &&
      platform.requireEdgeFunctionAudit;
    checks.push(
      check(
        "platform_environment_staging_production_policies",
        policiesOk ? "pass" : "fail",
        policiesOk
          ? `Políticas ${platform.name} exigem auth real, sem mocks e edge_function.`
          : "Políticas de staging/production incompletas no perfil.",
        { blocking: !policiesOk, docPath: docPath },
      ),
    );
  } else {
    checks.push(
      check(
        "platform_environment_staging_production_policies",
        "skip",
        "Políticas restritivas aplicáveis a staging/production.",
      ),
    );
  }

  checks.push(
    check(
      "platform_environment_declared",
      platform.declaredExplicitly || platform.name === "development" ? "pass" : "warn",
      platform.declaredExplicitly
        ? `Ambiente ${platform.name} declarado explicitamente.`
        : "NEXT_PUBLIC_DOS_ENVIRONMENT ausente — default development aplicado.",
      { docPath },
    ),
  );

  if (platform.name === "development") {
    checks.push(
      check(
        "platform_environment_mocks_disabled",
        "skip",
        "Development permite mocks operacionais.",
      ),
    );
    checks.push(
      check(
        "platform_environment_mock_role_locked",
        "skip",
        "Development permite troca de mock role.",
      ),
    );
    checks.push(
      check(
        "platform_environment_auth_profile_required",
        "skip",
        "Auth profile opcional em development.",
      ),
    );
    checks.push(
      check(
        "platform_environment_edge_function_required",
        "skip",
        "edge_function opcional em development.",
      ),
    );
    checks.push(
      check(
        "platform_environment_dev_not_production_ready",
        "warn",
        "Development — não promover a revisão de produção.",
        { docPath },
      ),
    );
  } else {
    const mocksActive = auth.isUsingMockOperator;
    checks.push(
      check(
        "platform_environment_mocks_disabled",
        mocksActive ? "fail" : "pass",
        mocksActive
          ? "Operador mock ativo — ambiente exige auth real."
          : `Mocks desligados em ${platform.name}.`,
        { blocking: mocksActive, docPath },
      ),
    );
    checks.push(
      check(
        "platform_environment_mock_role_locked",
        auth.mockRoleChangeAllowed ? "fail" : "pass",
        auth.mockRoleChangeAllowed
          ? "Troca livre de mock role permitida indevidamente."
          : "Troca de mock role bloqueada.",
        { blocking: auth.mockRoleChangeAllowed, docPath },
      ),
    );
    const profileOk = auth.hasProfile && auth.operatorSource === "auth_profile";
    checks.push(
      check(
        "platform_environment_auth_profile_required",
        profileOk ? "pass" : "fail",
        profileOk
          ? "Auth profile real ativo."
          : "operator_profiles real obrigatório neste ambiente.",
        { blocking: !profileOk, docPath },
      ),
    );
    const writeMode = audit.supabaseWriteMode ?? edge.writeMode;
    checks.push(
      check(
        "platform_environment_edge_function_required",
        writeMode === "edge_function" ? "pass" : "fail",
        writeMode === "edge_function"
          ? "Audit writeMode edge_function confirmado."
          : `writeMode ${writeMode} — edge_function obrigatório em ${platform.name}.`,
        { blocking: writeMode !== "edge_function", docPath },
      ),
    );
    checks.push(
      check(
        "platform_environment_dev_not_production_ready",
        "pass",
        `${platform.name} elegível para revisão (sujeito aos demais checks).`,
      ),
    );
  }

  checks.push(
    check(
      "platform_environment_incompatible",
      platform.incompatible ? "fail" : "pass",
      platform.incompatible
        ? "Configuração runtime incompatível com políticas do ambiente."
        : "Configuração compatível com políticas do ambiente.",
      { blocking: platform.incompatible, docPath },
    ),
  );
}

export async function runProductionSafetyGate(
  input: RunProductionSafetyGateInput,
): Promise<ProductionSafetyReport> {
  const { config, client, auth, audit, edge, environment, platform } = input;
  const checks: ProductionSafetyCheck[] = [];

  // --- Supabase configurado ---
  if (!config.isConfigured || !client) {
    checks.push(
      check(
        "supabase_configured",
        "warn",
        "Supabase não configurado — modo local/mock (esperado em dev).",
        { docPath: "docs/operations/production-safety-gate.md" },
      ),
    );

    for (const id of [
      "core_tables_detected",
      "auth_api_available",
      "user_authenticated",
      "operator_profile_found",
      "effective_role_not_mock",
      "active_owner_present",
      "audit_write_mode_edge_function",
      "audit_remote_status_accepted",
      "audit_fallback_healthy",
      "pending_queue_within_limit",
      "edge_function_deployed",
    ] as ProductionSafetyCheckId[]) {
      checks.push(check(id, "skip", "Requer Supabase configurado."));
    }

    const prodMockOutcome = environment === "production" ? "fail" : "skip";
    checks.push(
      check(
        "production_mock_role_locked",
        auth.mockRoleChangeAllowed && environment === "production" ? "fail" : prodMockOutcome,
        environment === "production"
          ? auth.mockRoleChangeAllowed
            ? "Produção permite troca de mock role — risco de segurança."
            : "Troca de mock role bloqueada em produção."
          : "Check aplicável apenas em ambiente production.",
        {
          blocking: environment === "production" && auth.mockRoleChangeAllowed,
          docPath: "docs/architecture/auth-operator-handoff.md",
        },
      ),
    );

    appendPlatformEnvironmentChecks(checks, platform, auth, audit, edge);

    const status = resolveProductionSafetyStatus(checks, config);
    const { alertChecks } = partitionProductionSafetyChecks(checks);
    return buildProductionSafetyReport(
      status,
      environment,
      checks,
      buildProductionSafetyNextSteps(status, alertChecks),
    );
  }

  const connection = await runSupabaseHealthCheck(
    client,
    config,
    input.healthCheckOptions,
  );

  checks.push(
    check(
      "supabase_configured",
      connection.status === "error" ? "fail" : "pass",
      connection.status === "error"
        ? "Client configurado, mas health check falhou."
        : "Variáveis Supabase presentes e client inicializado.",
      {
        blocking: connection.status === "error",
        docPath: "docs/architecture/supabase-foundation.md",
      },
    ),
  );

  // --- Tabelas principais ---
  const profilesProbe = await probeSupabaseTableReadOnly(
    client,
    SUPABASE_TABLES.operatorProfiles,
  );
  const auditProbe = await probeSupabaseTableReadOnly(
    client,
    SUPABASE_TABLES.operationalAuditEntries,
  );
  const tablesOk = profilesProbe.detected && auditProbe.detected;

  checks.push(
    check(
      "core_tables_detected",
      tablesOk ? "pass" : "fail",
      tablesOk
        ? "operator_profiles e operational_audit_entries detectadas (probe read-only)."
        : "Tabela(s) principal(is) ausente(s) — migrations pendentes.",
      {
        blocking: !tablesOk,
        docPath: "docs/operations/apply-supabase-migrations.md",
      },
    ),
  );

  // --- Auth API ---
  try {
    const { error } = await client.auth.getSession();
    checks.push(
      check(
        "auth_api_available",
        error ? "fail" : "pass",
        error
          ? "Auth API indisponível — verifique projeto Supabase."
          : "Auth API respondeu (getSession read-only).",
        {
          blocking: Boolean(error),
          docPath: "docs/architecture/auth-foundation.md",
        },
      ),
    );
  } catch {
    checks.push(
      check(
        "auth_api_available",
        "fail",
        "Falha inesperada ao contactar Auth API.",
        { blocking: true, docPath: "docs/architecture/auth-foundation.md" },
      ),
    );
  }

  // --- Usuário autenticado ---
  if (auth.isLoading) {
    checks.push(
      check("user_authenticated", "warn", "Sessão auth ainda carregando…"),
    );
  } else if (auth.status === "authenticated") {
    checks.push(
      check("user_authenticated", "pass", "Sessão autenticada ativa."),
    );
  } else if (auth.status === "not_configured") {
    checks.push(
      check(
        "user_authenticated",
        "warn",
        "Auth em modo mock — login Supabase não disponível.",
      ),
    );
  } else {
    checks.push(
      check(
        "user_authenticated",
        "fail",
        "Nenhuma sessão autenticada — necessário para RBAC real.",
        { docPath: "docs/architecture/auth-login-ui.md" },
      ),
    );
  }

  // --- operator_profile ---
  if (auth.status !== "authenticated") {
    checks.push(
      check(
        "operator_profile_found",
        auth.status === "not_configured" ? "skip" : "fail",
        "Requer usuário autenticado com row em operator_profiles.",
        { docPath: "docs/architecture/auth-operator-handoff.md" },
      ),
    );
  } else if (auth.hasProfile) {
    checks.push(
      check(
        "operator_profile_found",
        "pass",
        "Profile operacional encontrado para a sessão.",
      ),
    );
  } else {
    checks.push(
      check(
        "operator_profile_found",
        "fail",
        "Autenticado sem operator_profiles — handoff usa fallback mock.",
        { docPath: "docs/architecture/auth-operator-handoff.md" },
      ),
    );
  }

  // --- Role efetiva não mock ---
  if (auth.isUsingMockOperator) {
    checks.push(
      check(
        "effective_role_not_mock",
        auth.status === "authenticated" ? "fail" : "warn",
        "RBAC efetivo ainda deriva de operador mock.",
        { docPath: "docs/architecture/auth-operator-handoff.md" },
      ),
    );
  } else if (auth.operatorSource === "auth_profile") {
    checks.push(
      check(
        "effective_role_not_mock",
        "pass",
        `Role efetiva via profile (${auth.effectiveRole}).`,
      ),
    );
  } else {
    checks.push(
      check(
        "effective_role_not_mock",
        "warn",
        `Fonte da role: ${auth.operatorSource} — confirme handoff real.`,
      ),
    );
  }

  // --- Owner real ativo ---
  const ownerActive =
    auth.profileRole === "owner" &&
    auth.profileStatus === "active" &&
    !auth.isUsingMockOperator;

  if (!auth.hasProfile) {
    checks.push(
      check(
        "active_owner_present",
        "fail",
        "Owner ativo requer profile com role owner e status active.",
        { docPath: "docs/architecture/auth-operator-handoff.md" },
      ),
    );
  } else if (ownerActive) {
    checks.push(
      check(
        "active_owner_present",
        "pass",
        "Owner ativo derivado de operator_profiles.",
      ),
    );
  } else if (auth.profileRole === "owner" && auth.profileStatus !== "active") {
    checks.push(
      check(
        "active_owner_present",
        "fail",
        "Profile owner encontrado, mas status não está active.",
      ),
    );
  } else {
    checks.push(
      check(
        "active_owner_present",
        "warn",
        "Profile presente, mas role efetiva não é owner ativo.",
      ),
    );
  }

  // --- Audit writeMode ---
  const writeMode = audit.supabaseWriteMode ?? edge.writeMode;
  checks.push(
    check(
      "audit_write_mode_edge_function",
      writeMode === "edge_function" ? "pass" : "fail",
      writeMode === "edge_function"
        ? "writeMode edge_function configurado."
        : `writeMode atual: ${writeMode} — produção exige edge_function.`,
      { docPath: "docs/architecture/audit-edge-function.md" },
    ),
  );

  // --- Último status remoto ---
  if (writeMode !== "edge_function") {
    checks.push(
      check(
        "audit_remote_status_accepted",
        "skip",
        "Aplicável apenas com writeMode edge_function.",
      ),
    );
  } else if (audit.lastRemoteStatus === "accepted") {
    checks.push(
      check(
        "audit_remote_status_accepted",
        "pass",
        "Último ingest remoto retornou accepted.",
      ),
    );
  } else if (audit.lastRemoteStatus === "rejected" || audit.lastRemoteStatus === "error") {
    checks.push(
      check(
        "audit_remote_status_accepted",
        "fail",
        `Último status remoto: ${audit.lastRemoteStatus}${audit.lastRemoteErrorCode ? ` (${audit.lastRemoteErrorCode})` : ""}.`,
        { docPath: "docs/architecture/audit-edge-function.md" },
      ),
    );
  } else {
    checks.push(
      check(
        "audit_remote_status_accepted",
        "warn",
        "Nenhum evento remoto accepted registrado ainda — gere um audit de teste.",
      ),
    );
  }

  // --- Fallback saudável ---
  const criticalFallback =
    audit.fallbackUsed &&
    (isCriticalAuditError(audit.lastError) || Boolean(audit.pendingQueueError));

  if (!audit.supabaseConfigured) {
    checks.push(
      check(
        "audit_fallback_healthy",
        "warn",
        "Audit Supabase não configurado — apenas localStorage.",
      ),
    );
  } else if (criticalFallback) {
    checks.push(
      check(
        "audit_fallback_healthy",
        "fail",
        "Fallback local com erro crítico — investigue antes de produção.",
        { docPath: "docs/architecture/audit-migration-supabase.md" },
      ),
    );
  } else if (audit.fallbackUsed) {
    checks.push(
      check(
        "audit_fallback_healthy",
        "warn",
        "Fallback localStorage ativo — remoto degradado.",
      ),
    );
  } else {
    checks.push(
      check(
        "audit_fallback_healthy",
        "pass",
        "Sem fallback crítico — persistência remota ou local estável.",
      ),
    );
  }

  // --- Pending queue ---
  const queueTotal = audit.pendingQueueTotal ?? 0;
  const queueFailed = audit.pendingQueueFailed ?? 0;

  if (audit.pendingQueueError) {
    checks.push(
      check(
        "pending_queue_within_limit",
        "fail",
        "Erro ao ler fila local de pendências.",
        { docPath: "docs/architecture/audit-pending-queue-cleanup.md" },
      ),
    );
  } else if (queueTotal > PRODUCTION_SAFETY_PENDING_QUEUE_LIMIT) {
    checks.push(
      check(
        "pending_queue_within_limit",
        "fail",
        `Fila com ${queueTotal} entradas (limite ${PRODUCTION_SAFETY_PENDING_QUEUE_LIMIT}).`,
        { docPath: "docs/architecture/audit-pending-queue-cleanup.md" },
      ),
    );
  } else if (queueFailed > 0) {
    checks.push(
      check(
        "pending_queue_within_limit",
        "warn",
        `${queueFailed} pendência(s) com falha — abaixo do limite, mas requer atenção.`,
      ),
    );
  } else {
    checks.push(
      check(
        "pending_queue_within_limit",
        "pass",
        `Fila local: ${queueTotal} entrada(s) (limite ${PRODUCTION_SAFETY_PENDING_QUEUE_LIMIT}).`,
      ),
    );
  }

  // --- Edge Function ---
  const edgeNameOk = edge.edgeFunctionName === "audit-ingest";
  if (writeMode === "edge_function") {
    if (audit.edgeFunctionNotDeployed) {
      checks.push(
        check(
          "edge_function_deployed",
          "fail",
          "writeMode edge_function, mas função não deployada (invoke 404).",
          { docPath: "docs/architecture/audit-edge-function.md" },
        ),
      );
    } else if (edgeNameOk) {
      checks.push(
        check(
          "edge_function_deployed",
          "pass",
          "Edge Function audit-ingest indicada como disponível.",
        ),
      );
    } else {
      checks.push(
        check(
          "edge_function_deployed",
          "warn",
          "Nome da Edge Function não reconhecido no config.",
        ),
      );
    }
  } else {
    checks.push(
      check(
        "edge_function_deployed",
        edgeNameOk ? "pass" : "warn",
        edgeNameOk
          ? "Função documentada no monorepo (deploy manual antes de edge_function)."
          : "Edge Function não reconhecida.",
        { docPath: "docs/architecture/audit-edge-function.md" },
      ),
    );
  }

  // --- Produção mock role ---
  if (environment === "production") {
    checks.push(
      check(
        "production_mock_role_locked",
        auth.mockRoleChangeAllowed ? "fail" : "pass",
        auth.mockRoleChangeAllowed
          ? "Produção permite troca livre de mock role — bloqueado."
          : "Troca de mock role desabilitada em produção.",
        {
          blocking: auth.mockRoleChangeAllowed,
          docPath: "docs/architecture/auth-operator-handoff.md",
        },
      ),
    );
  } else {
    checks.push(
      check(
        "production_mock_role_locked",
        auth.mockRoleChangeAllowed ? "pass" : "warn",
        auth.mockRoleChangeAllowed
          ? "Dev/staging — troca mock permitida (esperado)."
          : "Troca mock bloqueada neste ambiente.",
      ),
    );
  }

  // --- Observabilidade ingest (Sprint 5.36) — warnings only, amostra insuficiente não bloqueia ---
  const ingestAttempts = audit.ingestTotalAttempts ?? 0;
  const ingestAccepted = audit.ingestAccepted ?? 0;
  const writeModeObs = audit.supabaseWriteMode ?? edge.writeMode;

  if (writeModeObs !== "edge_function" || !audit.supabaseConfigured) {
    checks.push(
      check(
        "audit_ingest_accepted_observed",
        "skip",
        "Aplicável com writeMode edge_function e Supabase configurado.",
      ),
    );
    checks.push(
      check(
        "audit_ingest_failure_rate",
        "skip",
        "Métricas de sessão — requer ingest remoto ativo.",
      ),
    );
    checks.push(
      check(
        "audit_ingest_no_critical_errors",
        "skip",
        "Sem telemetria de ingest nesta configuração.",
      ),
    );
  } else if (ingestAttempts === 0) {
    checks.push(
      check(
        "audit_ingest_accepted_observed",
        "warn",
        "Nenhuma tentativa de ingest na sessão — amostra insuficiente.",
        { docPath: "docs/architecture/audit-ingest-observability.md" },
      ),
    );
    checks.push(
      check(
        "audit_ingest_failure_rate",
        "warn",
        "Sem tentativas registradas — taxa indeterminada.",
      ),
    );
    checks.push(
      check(
        "audit_ingest_no_critical_errors",
        "pass",
        "Nenhum erro de ingest na sessão atual.",
      ),
    );
  } else {
    checks.push(
      check(
        "audit_ingest_accepted_observed",
        ingestAccepted > 0 ? "pass" : "warn",
        ingestAccepted > 0
          ? `${ingestAccepted} ingest accepted na sessão.`
          : "Nenhum accepted observado na sessão — gere evento de teste.",
        { docPath: "docs/architecture/audit-ingest-observability.md" },
      ),
    );

    const failedPlusRejected = (audit.ingestRejected ?? 0) + (audit.ingestFailed ?? 0);
    const failureRate =
      ingestAttempts >= PRODUCTION_SAFETY_INGEST_MIN_ATTEMPTS
        ? failedPlusRejected / ingestAttempts
        : null;

    if (failureRate === null) {
      checks.push(
        check(
          "audit_ingest_failure_rate",
          "warn",
          `Amostra insuficiente (${ingestAttempts}/${PRODUCTION_SAFETY_INGEST_MIN_ATTEMPTS} tentativas).`,
        ),
      );
    } else if (failureRate > PRODUCTION_SAFETY_INGEST_CRITICAL_FAILURE_RATE) {
      checks.push(
        check(
          "audit_ingest_failure_rate",
          "warn",
          `Taxa de falha ${Math.round(failureRate * 100)}% na sessão (${failedPlusRejected}/${ingestAttempts}).`,
        ),
      );
    } else {
      checks.push(
        check(
          "audit_ingest_failure_rate",
          "pass",
          `Taxa de falha ${Math.round(failureRate * 100)}% (${failedPlusRejected}/${ingestAttempts}).`,
        ),
      );
    }

    const criticalIngest = isCriticalIngestErrorCode(audit.ingestLastErrorCode);
    checks.push(
      check(
        "audit_ingest_no_critical_errors",
        criticalIngest ? "warn" : "pass",
        criticalIngest
          ? `Último errorCode crítico: ${audit.ingestLastErrorCode}.`
          : "Nenhum errorCode crítico recente na sessão.",
      ),
    );
  }

  appendPlatformEnvironmentChecks(checks, platform, auth, audit, edge);

  const status = resolveProductionSafetyStatus(checks, config);
  const { alertChecks } = partitionProductionSafetyChecks(checks);

  return buildProductionSafetyReport(
    status,
    environment,
    checks,
    buildProductionSafetyNextSteps(status, alertChecks),
  );
}
