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
  | "audit_ingest_no_critical_errors"
  | "platform_environment_declared"
  | "platform_environment_mocks_disabled"
  | "platform_environment_mock_role_locked"
  | "platform_environment_auth_profile_required"
  | "platform_environment_edge_function_required"
  | "platform_environment_incompatible"
  | "platform_environment_dev_not_production_ready"
  | "platform_environment_canonical_resolved"
  | "platform_environment_no_critical_mismatch"
  | "platform_environment_production_explicit"
  | "platform_environment_preview_not_production"
  | "platform_environment_staging_production_policies"
  | "mission_persistence_remote_validated"
  | "mission_rehydration_validated"
  | "mission_interrupted_recovery_validated"
  | "diagnostics_agent_history_validated"
  | "release_agent_history_validated"
  | "multi_agent_metrics_isolation_validated"
  | "mission_fallback_inactive_staging";

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
  platform_environment_declared: "Ambiente DOS explicitamente definido",
  platform_environment_mocks_disabled: "Mocks desligados (staging/production)",
  platform_environment_mock_role_locked: "Mock role bloqueada no ambiente",
  platform_environment_auth_profile_required: "Auth profile real esperado",
  platform_environment_edge_function_required: "Audit edge_function esperado",
  platform_environment_incompatible: "Configuração incompatível com ambiente",
  platform_environment_dev_not_production_ready: "Development não pronto para produção",
  platform_environment_canonical_resolved: "Ambiente canônico resolvido",
  platform_environment_no_critical_mismatch: "Sem divergência crítica entre fontes",
  platform_environment_production_explicit: "Production declarado explicitamente",
  platform_environment_preview_not_production: "Preview não interpretado como production",
  platform_environment_staging_production_policies: "Políticas staging/production corretas",
  mission_persistence_remote_validated: "Persistência remota de missões validada",
  mission_rehydration_validated: "Reidratação validada em staging",
  mission_interrupted_recovery_validated: "Recovery interrupted validado",
  diagnostics_agent_history_validated: "Histórico diagnostics agent validado",
  release_agent_history_validated: "Histórico release agent validado",
  multi_agent_metrics_isolation_validated: "Isolamento multi-agent validado",
  mission_fallback_inactive_staging: "Fallback inativo em staging",
};

/** Mínimo de tentativas para avaliar taxa de falha (Sprint 5.36). */
export const PRODUCTION_SAFETY_INGEST_MIN_ATTEMPTS = 3;

/** Taxa de falha acima disso gera alerta quando amostra suficiente. */
export const PRODUCTION_SAFETY_INGEST_CRITICAL_FAILURE_RATE = 0.5;

/** Limite seguro de entradas na fila local de pendências (Sprint 5.34). */
export const PRODUCTION_SAFETY_PENDING_QUEUE_LIMIT = 25;
