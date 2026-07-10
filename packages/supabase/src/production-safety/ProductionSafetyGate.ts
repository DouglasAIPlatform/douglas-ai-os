import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseConfig } from "../SupabaseConfig";
import type { SupabaseConnectionState } from "../SupabaseConnectionStatus";
import type { SupabaseEnvironment } from "../SupabaseEnvironment";
import { runSupabaseHealthCheck, type SupabaseHealthCheckOptions } from "../SupabaseHealthCheck";
import { SUPABASE_TABLES } from "../schema";
import { probeSupabaseTableReadOnly } from "../staging-validation/probeSupabaseTableReadOnly";
import type { StagingValidationAuditSnapshot, StagingValidationEdgeSnapshot } from "../staging-validation/SupabaseStagingValidation";
import {
  PRODUCTION_SAFETY_CHECK_LABELS,
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

export async function runProductionSafetyGate(
  input: RunProductionSafetyGateInput,
): Promise<ProductionSafetyReport> {
  const { config, client, auth, audit, edge, environment } = input;
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

  const status = resolveProductionSafetyStatus(checks, config);
  const { alertChecks } = partitionProductionSafetyChecks(checks);

  return buildProductionSafetyReport(
    status,
    environment,
    checks,
    buildProductionSafetyNextSteps(status, alertChecks),
  );
}
