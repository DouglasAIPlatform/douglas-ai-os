import type {
  AuthMode,
  AuthOperatorHandoffState,
  AuthProviderKind,
  AuthStatus,
  OperatorRoleSource,
} from "./AuthTypes";

export const AUTH_STATUS_LABELS: Record<AuthStatus, string> = {
  not_configured: "Não configurado",
  loading: "Carregando sessão",
  unauthenticated: "Sem sessão",
  authenticated: "Sessão ativa",
  error: "Erro de auth",
};

export const AUTH_MODE_LABELS: Record<AuthMode, string> = {
  mock: "Mock (dev)",
  supabase_ready: "Supabase pronto",
  authenticated: "Autenticado",
};

export const AUTH_PROVIDER_LABELS: Record<AuthProviderKind, string> = {
  none: "Nenhum",
  supabase: "Supabase Auth",
};

export const AUTH_OPERATOR_HANDOFF_STATE_LABELS: Record<AuthOperatorHandoffState, string> = {
  mock_operator: "Operador mock",
  profile_missing: "Autenticado sem profile",
  authenticated_with_active_profile: "Profile ativo autorizado",
  authenticated_with_inactive_profile: "Profile inativo (fallback dev)",
  blocked_by_profile_status: "Bloqueado — profile inativo",
  profile_error: "Erro de profile / auth",
  not_configured: "Auth não configurado",
  authenticated_with_profile: "Profile ativo (legado)",
  authenticated_without_profile: "Sem profile (legado)",
};

export const OPERATOR_ROLE_SOURCE_LABELS: Record<OperatorRoleSource, string> = {
  mock: "Mock (dev)",
  auth_profile: "Auth profile",
  fallback: "Fallback mock",
  blocked: "Bloqueado",
};
