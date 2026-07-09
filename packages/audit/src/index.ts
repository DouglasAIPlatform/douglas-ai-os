export type {
  AuditAction,
  AuditEntry,
  AuditPersistenceAdapter,
  AuditSeverity,
  AuditSource,
} from "./AuditTypes";

export type { AuditPersistenceConfig } from "./AuditPersistenceConfig";
export type { AuditPersistenceMode } from "./AuditPersistenceMode";
export type { AuditPersistenceStatus } from "./AuditPersistenceStatus";
export type { AuditPendingEntry } from "./AuditPendingEntry";
export type { AuditPendingQueue } from "./AuditPendingQueue";
export type { AuditRetryPolicy } from "./AuditRetryPolicy";
export type { AuditRetryStatus } from "./AuditRetryStatus";
export type { AuditSyncResult } from "./AuditSyncResult";
export type { AuditPersistenceIntegrationConfig } from "./AuditProvider";

export {
  AUDIT_ACTION_LABELS,
  AUDIT_SEVERITY_LABELS,
  AUDIT_SOURCE_LABELS,
  AUDITED_EVENT_TOPICS,
} from "./AuditTypes";

export {
  DEFAULT_AUDIT_PERSISTENCE_CONFIG,
} from "./AuditPersistenceConfig";

export {
  AUDIT_PERSISTENCE_MODE_LABELS,
  resolveEffectiveAuditPersistenceMode,
  shouldAttemptSupabaseWrite,
  shouldWriteToLocalStorage,
} from "./AuditPersistenceMode";

export {
  DEFAULT_AUDIT_PERSISTENCE_STATUS,
  syncLegacyPersistenceStatusFields,
} from "./AuditPersistenceStatus";

export {
  AUDIT_RETRY_STATUS_LABELS,
} from "./AuditRetryStatus";

export {
  DEFAULT_AUDIT_RETRY_POLICY,
} from "./AuditRetryPolicy";

export {
  EMPTY_AUDIT_SYNC_RESULT,
} from "./AuditSyncResult";

export {
  createAuditPendingEntry,
  isAuditPendingEntry,
  resolvePendingEntryIds,
} from "./AuditPendingEntry";

export {
  createLocalStorageAuditPendingQueue,
  DEFAULT_AUDIT_PENDING_QUEUE_STORAGE_KEY,
  DEFAULT_LOCAL_STORAGE_AUDIT_PENDING_QUEUE_CONFIG,
  LocalStorageAuditPendingQueue,
  type LocalStorageAuditPendingQueueConfig,
} from "./LocalStorageAuditPendingQueue";

export {
  AuditSyncManager,
  createAuditSyncManager,
  type AuditSyncManagerConfig,
  type AuditSyncManagerState,
} from "./AuditSyncManager";

export { AuditStore, createAuditStore, type AuditStoreOptions } from "./AuditStore";
export { AuditLog, createAuditLog, type AuditLogOptions } from "./AuditLog";
export {
  createAuditMapperState,
  getAuditCorrelationRef,
  isAuditedEventTopic,
  isAuditEntryPersistedLocally,
  mapEventToAuditEntries,
  type AuditMapperState,
} from "./AuditEventMapper";
export { resolveAuditActor, type ResolvedAuditActor } from "./AuditActorResolver";
export {
  createLocalStorageAuditPersistenceAdapter,
  LocalStorageAuditPersistenceAdapter,
} from "./LocalStorageAuditPersistenceAdapter";

export {
  CompositeAuditPersistenceAdapter,
  createCompositeAuditPersistenceAdapter,
  isAuditPersistenceAdapterWithStatus,
  readAuditPersistenceStatus,
  type AuditPersistenceAdapterWithStatus,
  type CompositeAuditPersistenceConfig,
} from "./CompositeAuditPersistenceAdapter";

export type { SupabaseAuditPersistenceConfig } from "./SupabaseAuditPersistenceConfig";
export {
  DEFAULT_SUPABASE_AUDIT_PERSISTENCE_CONFIG,
  DEFAULT_SUPABASE_AUDIT_TABLE,
} from "./SupabaseAuditPersistenceConfig";
export type {
  SupabaseAuditWriteMode,
} from "./SupabaseAuditWriteMode";
export {
  DEFAULT_AUDIT_EDGE_FUNCTION_NAME,
  DEFAULT_SUPABASE_AUDIT_WRITE_MODE,
  SUPABASE_AUDIT_WRITE_MODE_LABELS,
  isSupabaseAuditWriteMode,
} from "./SupabaseAuditWriteMode";
export type { AuditIngestPayload, AuditIngestValidationError, AuditIngestValidationResult } from "./AuditIngestPayload";
export {
  auditEntryToIngestPayload,
  validateAuditEntryForIngest,
} from "./AuditIngestPayload";
export type {
  AuditIngestErrorCode,
  AuditIngestResponse,
  AuditIngestResponseStatus,
} from "./AuditIngestResponse";
export {
  AUDIT_INGEST_ERROR_CODE_LABELS,
  AUDIT_INGEST_RESPONSE_STATUS_LABELS,
  parseAuditIngestResponse,
  sanitizeAuditErrorForDisplay,
} from "./AuditIngestResponse";
export { invokeAuditIngestEdgeFunction, type InvokeAuditIngestOptions } from "./SupabaseAuditEdgeInvoke";
export type { SupabaseAuditAppendResult, SupabaseTableProbeResult } from "./SupabaseAuditResults";
export {
  createSupabaseAuditPersistenceAdapter,
  SupabaseAuditPersistenceAdapter,
} from "./SupabaseAuditPersistenceAdapter";
export {
  auditEntryToOperationalAuditRow,
  operationalAuditRowToAuditEntry,
} from "./SupabaseAuditRowMapper";

export { AuditContext, type AuditContextValue } from "./AuditContext";
export { AuditProvider, type AuditProviderProps } from "./AuditProvider";
export { useAudit } from "./useAudit";
