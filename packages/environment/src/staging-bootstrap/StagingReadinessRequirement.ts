export type StagingReadinessRequirementScope = "static" | "runtime";

export type StagingReadinessRequirementId =
  | "dos_environment_explicit"
  | "environment_is_staging"
  | "supabase_configured"
  | "auth_api_available"
  | "real_session"
  | "active_profile"
  | "role_not_mock"
  | "audit_edge_function"
  | "audit_ingest_auth_required"
  | "last_audit_accepted"
  | "pending_queue_controlled"
  | "no_critical_environment_mismatch"
  | "release_readiness_approved"
  | "migrations_documented"
  | "mocks_blocked"
  | "mock_role_blocked"
  | "real_auth_required"
  | "server_rbac_expected";

export interface StagingReadinessRequirement {
  id: StagingReadinessRequirementId;
  label: string;
  scope: StagingReadinessRequirementScope;
  /** Falha bloqueia status final quando verificável estaticamente. */
  blockingWhenStatic: boolean;
}

export const STAGING_READINESS_REQUIREMENTS: readonly StagingReadinessRequirement[] = [
  {
    id: "dos_environment_explicit",
    label: "NEXT_PUBLIC_DOS_ENVIRONMENT declarado explicitamente",
    scope: "static",
    blockingWhenStatic: false,
  },
  {
    id: "environment_is_staging",
    label: "Ambiente efetivo = staging",
    scope: "static",
    blockingWhenStatic: false,
  },
  {
    id: "supabase_configured",
    label: "Supabase configurado (URL + anon key presentes)",
    scope: "static",
    blockingWhenStatic: false,
  },
  {
    id: "mocks_blocked",
    label: "Mocks desligados em staging",
    scope: "static",
    blockingWhenStatic: true,
  },
  {
    id: "mock_role_blocked",
    label: "Troca de mock role bloqueada",
    scope: "static",
    blockingWhenStatic: true,
  },
  {
    id: "real_auth_required",
    label: "Login real exigido pela política",
    scope: "static",
    blockingWhenStatic: true,
  },
  {
    id: "audit_edge_function",
    label: "writeMode edge_function para audit",
    scope: "static",
    blockingWhenStatic: true,
  },
  {
    id: "migrations_documented",
    label: "Migrations esperadas documentadas",
    scope: "static",
    blockingWhenStatic: true,
  },
  {
    id: "server_rbac_expected",
    label: "RBAC server-side esperado (migrations + helpers)",
    scope: "static",
    blockingWhenStatic: true,
  },
  {
    id: "auth_api_available",
    label: "Auth API disponível",
    scope: "runtime",
    blockingWhenStatic: false,
  },
  {
    id: "real_session",
    label: "Sessão autenticada real",
    scope: "runtime",
    blockingWhenStatic: false,
  },
  {
    id: "active_profile",
    label: "operator_profile ativo",
    scope: "runtime",
    blockingWhenStatic: false,
  },
  {
    id: "role_not_mock",
    label: "Role efetiva não mock",
    scope: "runtime",
    blockingWhenStatic: false,
  },
  {
    id: "audit_ingest_auth_required",
    label: "AUDIT_INGEST_AUTH_MODE=required no remoto",
    scope: "runtime",
    blockingWhenStatic: false,
  },
  {
    id: "last_audit_accepted",
    label: "Último audit remoto accepted",
    scope: "runtime",
    blockingWhenStatic: false,
  },
  {
    id: "pending_queue_controlled",
    label: "Fila de pendências de audit controlada",
    scope: "runtime",
    blockingWhenStatic: false,
  },
  {
    id: "no_critical_environment_mismatch",
    label: "Sem mismatch crítico de ambiente",
    scope: "runtime",
    blockingWhenStatic: false,
  },
  {
    id: "release_readiness_approved",
    label: "Release readiness aprovado",
    scope: "runtime",
    blockingWhenStatic: false,
  },
] as const;
