export type ProductionSafetyCheckOutcome = "pass" | "warn" | "fail" | "skip";

export type ProductionSafetyCheckId =
  | "supabase_configured"
  | "core_tables_detected"
  | "auth_api_available"
  | "user_authenticated"
  | "operator_profile_found"
  | "effective_role_not_mock"
  | "active_owner_present"
  | "audit_write_mode_edge_function"
  | "audit_remote_status_accepted"
  | "audit_fallback_healthy"
  | "pending_queue_within_limit"
  | "edge_function_deployed"
  | "production_mock_role_locked"
  | "audit_ingest_accepted_observed"
  | "audit_ingest_failure_rate"
  | "audit_ingest_no_critical_errors";

export interface ProductionSafetyCheck {
  id: ProductionSafetyCheckId;
  label: string;
  outcome: ProductionSafetyCheckOutcome;
  message: string;
  /** Quando true e outcome === fail, status geral vira blocked. */
  blocking: boolean;
  docPath?: string;
}

export const PRODUCTION_SAFETY_CHECK_LABELS: Record<ProductionSafetyCheckId, string> = {
  supabase_configured: "Supabase configurado",
  core_tables_detected: "Tabelas principais detectadas",
  auth_api_available: "Auth API disponível",
  user_authenticated: "Usuário autenticado",
  operator_profile_found: "operator_profiles encontrado",
  effective_role_not_mock: "Role efetiva não é mock",
  active_owner_present: "Owner real ativo",
  audit_write_mode_edge_function: "Audit writeMode edge_function",
  audit_remote_status_accepted: "Último status remoto audit accepted",
  audit_fallback_healthy: "Fallback local sem erros críticos",
  pending_queue_within_limit: "Fila de pendências abaixo do limite",
  edge_function_deployed: "Edge Function audit-ingest indicada",
  production_mock_role_locked: "Produção bloqueia troca livre de mock role",
  audit_ingest_accepted_observed: "Ingest remoto accepted observado (sessão)",
  audit_ingest_failure_rate: "Taxa de falha de ingest na sessão",
  audit_ingest_no_critical_errors: "Sem erro crítico recente de ingest",
};

/** Mínimo de tentativas para avaliar taxa de falha (Sprint 5.36). */
export const PRODUCTION_SAFETY_INGEST_MIN_ATTEMPTS = 3;

/** Taxa de falha acima disso gera alerta quando amostra suficiente. */
export const PRODUCTION_SAFETY_INGEST_CRITICAL_FAILURE_RATE = 0.5;

/** Limite seguro de entradas na fila local de pendências (Sprint 5.34). */
export const PRODUCTION_SAFETY_PENDING_QUEUE_LIMIT = 25;
