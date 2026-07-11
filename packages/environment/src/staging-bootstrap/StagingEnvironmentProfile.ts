import { ENVIRONMENT_PROFILES } from "../EnvironmentProfile";
import type { EnvironmentProfile } from "../EnvironmentProfile";

/** Políticas operacionais exclusivas de staging — espelha ENVIRONMENT_PROFILES.staging + requisitos de bootstrap. */
export interface StagingEnvironmentProfile extends EnvironmentProfile {
  /** Projeto Supabase dedicado — nunca compartilhar com production. */
  requireSeparateSupabaseProject: boolean;
  /** AUDIT_INGEST_AUTH_MODE=required no ambiente remoto (Edge secrets). */
  requireAuditIngestAuthRequired: boolean;
  /** Revisão humana antes de promover staging → production. */
  requireHumanReviewBeforeProduction: boolean;
  /** RBAC server-side via migrations aplicadas manualmente. */
  requireServerSideRbac: boolean;
  /** Fallback local de audit tratado como alerta, não como modo principal. */
  treatLocalAuditFallbackAsWarning: boolean;
}

export const STAGING_ENVIRONMENT_PROFILE: StagingEnvironmentProfile = {
  ...ENVIRONMENT_PROFILES.staging,
  requireSeparateSupabaseProject: true,
  requireAuditIngestAuthRequired: true,
  requireHumanReviewBeforeProduction: true,
  requireServerSideRbac: true,
  treatLocalAuditFallbackAsWarning: true,
};

export function getStagingEnvironmentProfile(): StagingEnvironmentProfile {
  return { ...STAGING_ENVIRONMENT_PROFILE };
}
