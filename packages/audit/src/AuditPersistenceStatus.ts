import type { AuditPersistenceMode } from "./AuditPersistenceMode";
import type { AuditRetryStatus } from "./AuditRetryStatus";
import type { AuditSyncResult } from "./AuditSyncResult";
import type { SupabaseAuditWriteMode } from "./SupabaseAuditWriteMode";

export type AuditPersistenceAdapterKind =
  | "localStorage"
  | "supabase"
  | "composite"
  | "none";

export interface AuditPersistenceStatus {
  enabled: boolean;
  mode: AuditPersistenceMode;
  /** Primary adapter currently serving reads/writes. */
  activeAdapter: AuditPersistenceAdapterKind;
  /** @deprecated Use activeAdapter */
  adapter: AuditPersistenceAdapterKind;
  fallbackUsed: boolean;
  supabaseConfigured: boolean;
  /** null = not probed yet; false = table missing or inaccessible. */
  supabaseTableReady: boolean | null;
  persistedCount: number;
  pendingEntries: number;
  lastPersistedAt: string | null;
  lastHydratedAt: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
  /** @deprecated Use lastError */
  error: string | null;
  /** Modo de escrita Supabase quando adapter ativo. */
  supabaseWriteMode?: SupabaseAuditWriteMode;
  /** Último status remoto da Edge Function (modo edge_function). */
  lastRemoteStatus?: "accepted" | "rejected" | "error" | null;
  /** Código de erro remoto seguro para UI. */
  lastRemoteErrorCode?: string | null;
  /** Edge Function configurada mas não deployada (invoke 404). */
  edgeFunctionNotDeployed?: boolean;
  /** Status da fila de pendências / último retry manual. */
  syncStatus?: AuditRetryStatus;
  /** Timestamp ISO do último retry manual. */
  lastRetryAt?: string | null;
  /** Último erro do retry manual (sanitizado para UI). */
  lastRetryError?: string | null;
  /** Resultado resumido do último retry manual. */
  lastSyncResult?: AuditSyncResult | null;
  /** Erro ao ler/escrever a fila local de pendências. */
  pendingQueueError?: string | null;
}

export const DEFAULT_AUDIT_PERSISTENCE_STATUS: AuditPersistenceStatus = {
  enabled: false,
  mode: "localStorage",
  activeAdapter: "none",
  adapter: "none",
  fallbackUsed: false,
  supabaseConfigured: false,
  supabaseTableReady: null,
  persistedCount: 0,
  pendingEntries: 0,
  lastPersistedAt: null,
  lastHydratedAt: null,
  lastSyncAt: null,
  lastError: null,
  error: null,
  syncStatus: "idle",
  lastRetryAt: null,
  lastRetryError: null,
  lastSyncResult: null,
  pendingQueueError: null,
};

export function syncLegacyPersistenceStatusFields(
  status: Omit<AuditPersistenceStatus, "adapter" | "error"> &
    Partial<Pick<AuditPersistenceStatus, "adapter" | "error">>,
): AuditPersistenceStatus {
  return {
    ...status,
    adapter: status.adapter ?? status.activeAdapter,
    error: status.error ?? status.lastError,
  };
}
