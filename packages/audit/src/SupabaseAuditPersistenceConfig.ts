import type { SupabaseAuditWriteMode } from "./SupabaseAuditWriteMode";
import {
  DEFAULT_AUDIT_EDGE_FUNCTION_NAME,
  DEFAULT_SUPABASE_AUDIT_WRITE_MODE,
} from "./SupabaseAuditWriteMode";

/** Tabela alvo para Operational Audit Log (migration 5.20). */
export const DEFAULT_SUPABASE_AUDIT_TABLE = "operational_audit_entries";

export interface SupabaseAuditPersistenceConfig {
  /** Desligado por padrão — localStorage permanece ativo. */
  enabled: boolean;
  tableName: string;
  /**
   * direct_client — INSERT via browser (bloqueado por RLS; fallback local).
   * edge_function — invoke audit-ingest (recomendado após deploy).
   */
  writeMode: SupabaseAuditWriteMode;
  /** Nome da Edge Function (supabase/functions/audit-ingest). */
  edgeFunctionName: string;
}

export const DEFAULT_SUPABASE_AUDIT_PERSISTENCE_CONFIG: SupabaseAuditPersistenceConfig = {
  enabled: false,
  tableName: DEFAULT_SUPABASE_AUDIT_TABLE,
  writeMode: DEFAULT_SUPABASE_AUDIT_WRITE_MODE,
  edgeFunctionName: DEFAULT_AUDIT_EDGE_FUNCTION_NAME,
};
