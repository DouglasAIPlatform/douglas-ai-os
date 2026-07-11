import type { StagingBootstrapStatus } from "./StagingBootstrapStatus";

export type StagingEffectiveEnvironment = "development" | "staging" | "production";

/** Snapshot seguro — nunca inclui URLs completas, keys, tokens, UIDs ou e-mails. */
export interface StagingConfigurationSnapshot {
  effectiveEnvironment: StagingEffectiveEnvironment;
  stagingDeclared: boolean;
  /** Indica presença de variáveis — não expõe valores. */
  supabaseUrlConfigured: boolean;
  anonKeyConfigured: boolean;
  supabaseConfigured: boolean;
  mocksBlocked: boolean;
  mockRoleBlocked: boolean;
  realAuthRequired: boolean;
  activeProfileRequired: boolean;
  auditWriteModeEdgeFunction: boolean;
  serverRbacExpected: boolean;
  migrationsSyncKnown: boolean;
  declaredExplicitly: boolean;
  hasCriticalMismatch: boolean;
  bootstrapStatus: StagingBootstrapStatus;
}

export function buildStagingConfigurationSnapshot(input: {
  effectiveEnvironment: StagingEffectiveEnvironment;
  stagingDeclared: boolean;
  supabaseUrlConfigured: boolean;
  anonKeyConfigured: boolean;
  mocksBlocked: boolean;
  mockRoleBlocked: boolean;
  realAuthRequired: boolean;
  activeProfileRequired: boolean;
  auditWriteModeEdgeFunction: boolean;
  serverRbacExpected: boolean;
  migrationsSyncKnown: boolean;
  declaredExplicitly: boolean;
  hasCriticalMismatch: boolean;
}): StagingConfigurationSnapshot {
  const supabaseConfigured = input.supabaseUrlConfigured && input.anonKeyConfigured;

  let bootstrapStatus: StagingBootstrapStatus = "not_configured";

  if (input.effectiveEnvironment !== "staging") {
    bootstrapStatus = "not_configured";
  } else if (!supabaseConfigured) {
    bootstrapStatus = "configuration_incomplete";
  } else if (
    input.mocksBlocked &&
    input.mockRoleBlocked &&
    input.auditWriteModeEdgeFunction &&
    input.serverRbacExpected
  ) {
    bootstrapStatus = "ready_for_validation";
  } else {
    bootstrapStatus = "configuration_incomplete";
  }

  return {
    ...input,
    supabaseConfigured,
    bootstrapStatus,
  };
}

/** Garante que snapshot não contém campos sensíveis conhecidos. */
export function assertStagingSnapshotSafe(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  const forbidden = [
    "supabaseUrl",
    "anonKey",
    "serviceRoleKey",
    "token",
    "email",
    "uid",
    "projectRef",
    "password",
  ];

  const json = JSON.stringify(value).toLowerCase();
  return !forbidden.some((key) => json.includes(`"${key.toLowerCase()}"`));
}
