/** Manifesto seguro do alvo staging — Sprint 5.53 (sem valores reais). */

export type StagingTargetStatus =
  | "not_started"
  | "configuration_prepared"
  | "remote_project_pending"
  | "remote_link_pending"
  | "migrations_pending"
  | "edge_function_pending"
  | "runtime_validation_pending"
  | "ready";

export const STAGING_TARGET_STATUS_LABELS: Record<StagingTargetStatus, string> = {
  not_started: "Não iniciado",
  configuration_prepared: "Codebase preparada",
  remote_project_pending: "Projeto remoto pendente",
  remote_link_pending: "Supabase CLI link pendente",
  migrations_pending: "Migrations pendentes",
  edge_function_pending: "Edge Function pendente",
  runtime_validation_pending: "Validação runtime pendente",
  ready: "Pronto para uso",
};

export interface StagingTargetManifest {
  environment: "staging";
  expectedReleaseChannel: "staging";
  requireSeparateSupabaseProject: true;
  requireRealAuth: true;
  requireActiveOperatorProfile: true;
  requireEdgeAudit: true;
  requireAuditAuthModeRequired: true;
  requireRemoteMissionPersistence: true;
}

/** Definição canônica — somente flags não sensíveis. */
export const STAGING_TARGET_MANIFEST: StagingTargetManifest = {
  environment: "staging",
  expectedReleaseChannel: "staging",
  requireSeparateSupabaseProject: true,
  requireRealAuth: true,
  requireActiveOperatorProfile: true,
  requireEdgeAudit: true,
  requireAuditAuthModeRequired: true,
  requireRemoteMissionPersistence: true,
};

const FORBIDDEN_MANIFEST_KEYS = [
  "supabaseUrl",
  "anonKey",
  "serviceRoleKey",
  "projectRef",
  "token",
  "password",
  "email",
  "uid",
] as const;

/** Garante que o manifesto não contém campos sensíveis. */
export function assertStagingTargetManifestSafe(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  const json = JSON.stringify(value).toLowerCase();
  return !FORBIDDEN_MANIFEST_KEYS.some((key) => json.includes(`"${key.toLowerCase()}"`));
}
