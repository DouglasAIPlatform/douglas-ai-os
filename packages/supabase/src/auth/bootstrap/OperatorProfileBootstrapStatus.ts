/** Lifecycle status for operator_profiles bootstrap (Sprint 5.29). */
export type OperatorProfileBootstrapStatus =
  | "not_authenticated"
  | "profile_found"
  | "profile_missing"
  | "bootstrap_required"
  | "bootstrap_blocked_by_rls"
  | "not_configured";

export const OPERATOR_PROFILE_BOOTSTRAP_STATUS_LABELS: Record<
  OperatorProfileBootstrapStatus,
  string
> = {
  not_configured: "Supabase não configurado",
  not_authenticated: "Sem sessão autenticada",
  profile_found: "Profile operacional encontrado",
  profile_missing: "Profile ausente",
  bootstrap_required: "Bootstrap necessário",
  bootstrap_blocked_by_rls: "Bootstrap bloqueado por RLS",
};

export const OPERATOR_PROFILE_BOOTSTRAP_STATUS_DESCRIPTIONS: Record<
  OperatorProfileBootstrapStatus,
  string
> = {
  not_configured:
    "Auth e operator_profiles indisponíveis — operador mock permanece ativo.",
  not_authenticated:
    "Faça login em /login quando Supabase e migrations estiverem prontos.",
  profile_found:
    "operator_profiles vinculado — handoff auth → operator pode usar RBAC do profile.",
  profile_missing:
    "Sessão ativa sem row em operator_profiles — verifique migrations e bootstrap.",
  bootstrap_required:
    "Primeiro owner deve ser provisionado manualmente antes do RBAC real.",
  bootstrap_blocked_by_rls:
    "INSERT via browser negado por RLS — use Dashboard/SQL com service_role.",
};
