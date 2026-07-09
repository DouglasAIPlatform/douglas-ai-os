import type {
  AuditPersistenceConfig,
  AuditPersistenceIntegrationConfig,
  AuditPersistenceMode,
  SupabaseAuditPersistenceConfig,
} from "@douglas/audit";
import {
  DEFAULT_AUDIT_PERSISTENCE_CONFIG,
  DEFAULT_SUPABASE_AUDIT_PERSISTENCE_CONFIG,
} from "@douglas/audit";

/**
 * Configuração de persistência do Operational Audit Log (Headquarters).
 *
 * - Sem Supabase: sempre localStorage (modo auto resolve para local).
 * - Com Supabase: auto tenta dual-write com fallback local seguro.
 */
export const auditLocalStorageConfig: AuditPersistenceConfig = {
  ...DEFAULT_AUDIT_PERSISTENCE_CONFIG,
  enabled: true,
  storageKey: "douglas-ai-os:operational-audit",
  maxEntries: 200,
};

export const auditSupabaseConfig: SupabaseAuditPersistenceConfig = {
  ...DEFAULT_SUPABASE_AUDIT_PERSISTENCE_CONFIG,
  enabled: true,
  writeMode: "edge_function",
};

/** Modo solicitado — efetivo depende de Supabase configurado. */
export const auditPersistenceMode: AuditPersistenceMode = "auto";

/** @deprecated Use auditLocalStorageConfig */
export const auditPersistenceConfig = auditLocalStorageConfig;

export function buildAuditPersistenceIntegration(
  options: {
    supabaseClient: AuditPersistenceIntegrationConfig["supabaseClient"];
    isSupabaseConfigured: boolean;
  },
): AuditPersistenceIntegrationConfig {
  return {
    mode: auditPersistenceMode,
    localStorage: auditLocalStorageConfig,
    supabase: auditSupabaseConfig,
    supabaseClient: options.supabaseClient,
    isSupabaseConfigured: options.isSupabaseConfigured,
  };
}
