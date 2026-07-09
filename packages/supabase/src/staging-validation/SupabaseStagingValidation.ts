import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseConfig } from "../SupabaseConfig";
import type { SupabaseConnectionState } from "../SupabaseConnectionStatus";
import { runSupabaseHealthCheck, type SupabaseHealthCheckOptions } from "../SupabaseHealthCheck";
import { SUPABASE_TABLES } from "../schema";
import { probeSupabaseTableReadOnly } from "./probeSupabaseTableReadOnly";
import type { SupabaseReadinessStatus } from "./SupabaseReadinessStatus";
import type { SupabaseValidationCheck } from "./SupabaseValidationCheck";
import { SUPABASE_VALIDATION_CHECK_LABELS } from "./SupabaseValidationCheck";
import { buildValidationReport, type SupabaseValidationReport } from "./SupabaseValidationReport";

export interface StagingValidationAuthSnapshot {
  status: string;
  mode: string;
  provider: string;
  hasProfile: boolean;
  isLoading: boolean;
}

export interface StagingValidationAuditSnapshot {
  supabaseConfigured: boolean;
  supabaseTableReady: boolean | null;
  supabaseWriteMode?: string;
  fallbackUsed: boolean;
  edgeFunctionNotDeployed?: boolean;
  lastError?: string | null;
}

export interface StagingValidationEdgeSnapshot {
  edgeFunctionName: string;
  writeMode: string;
}

export interface RunSupabaseStagingValidationInput {
  config: SupabaseConfig;
  client: SupabaseClient | null;
  connection: SupabaseConnectionState;
  healthCheckOptions?: SupabaseHealthCheckOptions;
  auth: StagingValidationAuthSnapshot;
  audit: StagingValidationAuditSnapshot;
  edge: StagingValidationEdgeSnapshot;
}

function check(
  id: SupabaseValidationCheck["id"],
  outcome: SupabaseValidationCheck["outcome"],
  message: string,
  docPath?: string,
): SupabaseValidationCheck {
  return {
    id,
    label: SUPABASE_VALIDATION_CHECK_LABELS[id],
    outcome,
    message,
    docPath,
  };
}

export function resolveSupabaseReadinessStatus(
  config: SupabaseConfig,
  connection: SupabaseConnectionState,
  checks: SupabaseValidationCheck[],
  auth: StagingValidationAuthSnapshot,
): SupabaseReadinessStatus {
  if (!config.isConfigured) {
    return "not_configured";
  }

  if (connection.status === "error" || auth.status === "error") {
    return "error";
  }

  const profiles = checks.find((item) => item.id === "operator_profiles_table");
  const auditTable = checks.find(
    (item) => item.id === "operational_audit_entries_table",
  );

  const profilesOk = profiles?.outcome === "pass";
  const auditOk = auditTable?.outcome === "pass";
  const connectionOk =
    connection.status === "connected" || connection.status === "configured";

  if (connectionOk && profilesOk && auditOk) {
    return "ready_for_auth";
  }

  if (
    connection.status === "connected" ||
    checks.find((item) => item.id === "auth_available")?.outcome === "pass"
  ) {
    if (!profilesOk || !auditOk) {
      return "ready_for_migration";
    }
  }

  if (connectionOk || config.isConfigured) {
    return "partially_configured";
  }

  return "error";
}

export function buildSuggestedNextSteps(
  readinessStatus: SupabaseReadinessStatus,
  alertChecks: SupabaseValidationCheck[],
): string[] {
  const steps: string[] = [];

  if (readinessStatus === "not_configured") {
    steps.push(
      "Copie .env.example → .env.local e preencha NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
    return steps;
  }

  if (readinessStatus === "error") {
    steps.push("Revise URL/anon key e status do projeto no Dashboard Supabase.");
    steps.push("Use o botão reverificar no SupabaseConnectionWidget.");
  }

  for (const alert of alertChecks) {
    switch (alert.id) {
      case "operator_profiles_table":
      case "operational_audit_entries_table":
        steps.push(
          "Aplique migrations conforme docs/operations/apply-supabase-migrations.md (read-only até lá).",
        );
        break;
      case "auth_session_status":
        if (alert.message.includes("sem profile")) {
          steps.push(
            "Após login, crie owner em operator_profiles — docs/architecture/auth-operator-handoff.md.",
          );
        } else {
          steps.push("Teste login em /login quando migrations estiverem aplicadas.");
        }
        break;
      case "audit_persistence_status":
        steps.push(
          "Audit remoto exige tabela + Edge Function — docs/architecture/audit-edge-function.md.",
        );
        break;
      case "edge_function_prepared":
        steps.push(
          "Deploy manual audit-ingest antes de writeMode edge_function em staging.",
        );
        break;
      default:
        break;
    }
  }

  if (readinessStatus === "ready_for_auth") {
    steps.push("Valide login + operator_profiles para RBAC real (handoff auth → operator).");
    steps.push(
      "Mantenha writeMode direct_client até Edge Function deployada; localStorage permanece fallback.",
    );
  }

  if (readinessStatus === "ready_for_migration") {
    steps.push("Siga docs/operations/supabase-migration-checklist.md antes de produção.");
  }

  return [...new Set(steps)];
}

export async function runSupabaseStagingValidation(
  input: RunSupabaseStagingValidationInput,
): Promise<SupabaseValidationReport> {
  const { config, client, auth, audit, edge } = input;
  const checks: SupabaseValidationCheck[] = [];

  if (!config.isConfigured || !client) {
    checks.push(
      check(
        "basic_connection",
        "fail",
        "Supabase não configurado — defina NEXT_PUBLIC_SUPABASE_URL e anon key.",
        "docs/operations/supabase-staging-validation.md",
      ),
    );
    checks.push(
      check(
        "auth_available",
        "skip",
        "Requer Supabase configurado.",
        undefined,
      ),
    );
    checks.push(
      check(
        "operator_profiles_table",
        "skip",
        "Probe ignorado — sem client Supabase.",
        "docs/operations/apply-supabase-migrations.md",
      ),
    );
    checks.push(
      check(
        "operational_audit_entries_table",
        "skip",
        "Probe ignorado — sem client Supabase.",
        "docs/operations/apply-supabase-migrations.md",
      ),
    );
    checks.push(
      check(
        "connection_widget_status",
        "skip",
        "SupabaseConnectionWidget em modo not_configured.",
        undefined,
      ),
    );

    const authOutcome = auth.status === "not_configured" ? "pass" : "warn";
    checks.push(
      check(
        "auth_session_status",
        authOutcome,
        auth.status === "not_configured"
          ? "Auth mock — comportamento esperado sem env vars."
          : `Auth ${auth.status} — inconsistência com client ausente.`,
        "docs/architecture/auth-foundation.md",
      ),
    );

    checks.push(
      check(
        "audit_persistence_status",
        "pass",
        "Audit em localStorage — modo offline/dev.",
        "docs/architecture/audit-migration-supabase.md",
      ),
    );

    checks.push(
      check(
        "edge_function_prepared",
        edge.edgeFunctionName === "audit-ingest" ? "pass" : "warn",
        `Edge Function ${edge.edgeFunctionName} documentada no monorepo (sem deploy).`,
        "docs/architecture/audit-edge-function.md",
      ),
    );

    const readinessStatus = resolveSupabaseReadinessStatus(
      config,
      input.connection,
      checks,
      auth,
    );
    const alertChecks = checks.filter(
      (item) => item.outcome === "warn" || item.outcome === "fail",
    );
    return buildValidationReport(
      readinessStatus,
      checks,
      buildSuggestedNextSteps(readinessStatus, alertChecks),
    );
  }

  const connection = await runSupabaseHealthCheck(
    client,
    config,
    input.healthCheckOptions,
  );

  checks.push(
    check(
      "basic_connection",
      connection.status === "error"
        ? "fail"
        : connection.status === "not_configured"
          ? "fail"
          : "pass",
      connection.message,
      "docs/operations/apply-supabase-migrations.md",
    ),
  );

  let authApiOk = false;
  try {
    const { error } = await client.auth.getSession();
    authApiOk = !error;
    checks.push(
      check(
        "auth_available",
        error ? "fail" : "pass",
        error
          ? "Auth API indisponível — verifique URL/anon key."
          : "Auth API respondeu (getSession read-only).",
        "docs/architecture/auth-foundation.md",
      ),
    );
  } catch {
    checks.push(
      check(
        "auth_available",
        "fail",
        "Falha inesperada ao contactar Auth API.",
        "docs/architecture/auth-foundation.md",
      ),
    );
  }

  const profilesProbe = await probeSupabaseTableReadOnly(
    client,
    SUPABASE_TABLES.operatorProfiles,
  );
  checks.push(
    check(
      "operator_profiles_table",
      profilesProbe.detected ? "pass" : "warn",
      profilesProbe.detected
        ? "Tabela detectada (probe SELECT read-only)."
        : "Tabela não detectada — migration operator_profiles pendente.",
      "docs/operations/apply-supabase-migrations.md",
    ),
  );

  const auditProbe = await probeSupabaseTableReadOnly(
    client,
    SUPABASE_TABLES.operationalAuditEntries,
  );
  checks.push(
    check(
      "operational_audit_entries_table",
      auditProbe.detected ? "pass" : "warn",
      auditProbe.detected
        ? "Tabela detectada (probe SELECT read-only)."
        : "Tabela não detectada — migration operational_audit_entries pendente.",
      "docs/operations/apply-supabase-migrations.md",
    ),
  );

  const connectionOutcome =
    connection.status === "connected"
      ? "pass"
      : connection.status === "configured"
        ? "warn"
        : connection.status === "error"
          ? "fail"
          : "warn";

  checks.push(
    check(
      "connection_widget_status",
      connectionOutcome,
      `Status atual: ${connection.status} — ${connection.message}`,
      "docs/architecture/supabase-foundation.md",
    ),
  );

  let authOutcome: SupabaseValidationCheck["outcome"] = "pass";
  let authMessage = `Auth ${auth.status} · modo ${auth.mode}`;

  if (auth.isLoading) {
    authOutcome = "warn";
    authMessage = "Sessão auth ainda carregando…";
  } else if (auth.status === "error") {
    authOutcome = "fail";
    authMessage = "Erro na camada AuthSessionProvider.";
  } else if (auth.status === "not_configured") {
    authOutcome = "warn";
    authMessage = "Auth em modo mock — Supabase auth não configurado.";
  } else if (auth.status === "authenticated" && !auth.hasProfile) {
    authOutcome = "warn";
    authMessage = "Autenticado sem operator_profiles — handoff usará fallback mock.";
  } else if (auth.status === "authenticated" && auth.hasProfile) {
    authMessage = "Autenticado com profile — handoff auth → operator disponível.";
  } else if (auth.status === "unauthenticated") {
    authOutcome = "warn";
    authMessage = "Supabase pronto — nenhuma sessão ativa (esperado antes de login).";
  }

  checks.push(
    check(
      "auth_session_status",
      authOutcome,
      authMessage,
      "docs/architecture/auth-operator-handoff.md",
    ),
  );

  let auditOutcome: SupabaseValidationCheck["outcome"] = "pass";
  let auditMessage = `Adapter ativo · fallback ${audit.fallbackUsed ? "sim" : "não"}`;

  if (!audit.supabaseConfigured) {
    auditOutcome = "skip";
    auditMessage = "Audit Supabase não configurado.";
  } else if (audit.supabaseTableReady === false) {
    auditOutcome = "warn";
    auditMessage = "Tabela audit indisponível — persistência remota usa fallback local.";
  } else if (audit.fallbackUsed) {
    auditOutcome = "warn";
    auditMessage = "Fallback localStorage ativo — remoto falhou ou RLS bloqueou INSERT.";
  } else if (audit.supabaseTableReady === true) {
    auditMessage = "Probe audit OK — dual-write/local conforme modo auto.";
  }

  checks.push(
    check(
      "audit_persistence_status",
      auditOutcome,
      auditMessage,
      "docs/architecture/audit-migration-supabase.md",
    ),
  );

  const edgePrepared = edge.edgeFunctionName === "audit-ingest";
  let edgeOutcome: SupabaseValidationCheck["outcome"] = edgePrepared ? "pass" : "warn";
  let edgeMessage = edgePrepared
    ? `Função ${edge.edgeFunctionName} preparada no monorepo (deploy manual).`
    : "Nome da Edge Function não reconhecido.";

  if (edge.writeMode === "edge_function") {
    if (audit.edgeFunctionNotDeployed) {
      edgeOutcome = "warn";
      edgeMessage =
        "writeMode edge_function ativo, mas função não deployada — localStorage fallback.";
    } else {
      edgeOutcome = "pass";
      edgeMessage = "Modo edge_function configurado — invoke disponível se deploy OK.";
    }
  }

  checks.push(
    check(
      "edge_function_prepared",
      edgeOutcome,
      edgeMessage,
      "docs/architecture/audit-edge-function.md",
    ),
  );

  if (!authApiOk && checks.find((c) => c.id === "basic_connection")?.outcome === "pass") {
    // keep connection pass but readiness may downgrade via error check
  }

  const readinessStatus = resolveSupabaseReadinessStatus(config, connection, checks, auth);
  const alertChecks = checks.filter(
    (item) => item.outcome === "warn" || item.outcome === "fail",
  );

  return buildValidationReport(
    readinessStatus,
    checks,
    buildSuggestedNextSteps(readinessStatus, alertChecks),
  );
}
