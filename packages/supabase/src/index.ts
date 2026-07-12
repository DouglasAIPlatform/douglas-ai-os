export type { SupabaseConfig, SupabaseEnvInput } from "./SupabaseConfig";
export {
  DEFAULT_SUPABASE_CONFIG,
  resolveSupabaseConfig,
} from "./SupabaseConfig";

export type { SupabaseEnvironment } from "./SupabaseEnvironment";
export {
  resolveSupabaseEnvironment,
  SUPABASE_ENVIRONMENT_LABELS,
} from "./SupabaseEnvironment";

export type {
  SupabaseConnectionState,
  SupabaseConnectionStatus,
} from "./SupabaseConnectionStatus";
export {
  DEFAULT_SUPABASE_CONNECTION_STATE,
  SUPABASE_CONNECTION_STATUS_LABELS,
} from "./SupabaseConnectionStatus";

export {
  createSupabaseBrowserClient,
  type DouglasSupabaseClient,
} from "./SupabaseClientFactory";

export {
  runSupabaseHealthCheck,
  type SupabaseHealthCheckOptions,
} from "./SupabaseHealthCheck";

export { SupabaseContext, type SupabaseContextValue } from "./SupabaseContext";
export { SupabaseProvider, type SupabaseProviderProps } from "./SupabaseProvider";
export { useSupabase } from "./useSupabase";

export type {
  OperationalAuditEntryRow,
  OperationalAuditEntryInsert,
  OperationalAuditSeverity,
  OperatorProfileRow,
  OperatorRolePermissionRow,
  OperatorSessionRow,
  MissionExecutionRow,
  MissionExecutionEventRow,
  MissionExecutionRowStatus,
  PlatformOperatorRole,
  PlatformOperatorStatus,
  PlatformSessionStatus,
  SupabaseTableName,
} from "./schema";
export {
  SUPABASE_TABLES,
  isOperationalAuditEntryRow,
} from "./schema";

export type {
  AuthAdapter,
  AuthAdapterSessionResult,
  AuthMode,
  AuthOperatorBridgeResult,
  AuthOperatorHandoffState,
  AuthProfile,
  AuthProviderKind,
  AuthRole,
  AuthSessionContextValue,
  AuthSessionProviderProps,
  AuthSessionState,
  AuthSignInCredentials,
  AuthSignInResult,
  AuthSignOutResult,
  AuthStatus,
  AuthUser,
  EffectiveOperatorResolution,
  MappedOperator,
  OperatorRoleSource,
  OperatorProfileBootstrapRecommendation,
  OperatorProfileBootstrapReport,
  OperatorProfileBootstrapRequestResult,
  OperatorProfileBootstrapStatus,
  RequestOperatorProfileBootstrapInput,
  ResolveOperatorProfileBootstrapInput,
  HandoffEventDedupResult,
  HandoffEventKey,
  HandoffEventTopic,
  HandoffRelevantTransition,
  HandoffStateSnapshot,
  HandoffTransition,
  HandoffTransitionReason,
} from "./auth";
export {
  AUTH_MODE_LABELS,
  AUTH_OPERATOR_HANDOFF_STATE_LABELS,
  AUTH_PROVIDER_LABELS,
  AUTH_STATUS_LABELS,
  HANDOFF_EVENT_TOPICS,
  HandoffEventDeduplicator,
  HandoffEventHistory,
  OPERATOR_PROFILE_BOOTSTRAP_STATUS_DESCRIPTIONS,
  OPERATOR_PROFILE_BOOTSTRAP_STATUS_LABELS,
  OPERATOR_ROLE_SOURCE_LABELS,
  AuthSessionContext,
  AuthSessionProvider,
  DEFAULT_AUTH_SESSION_STATE,
  buildHandoffEventKey,
  buildOperatorProfileBootstrapRecommendation,
  classifyHandoffTransition,
  createHandoffEventDeduplicator,
  createHandoffStateSnapshot,
  createSupabaseAuthAdapter,
  describeHandoffTransition,
  handoffSnapshotFingerprint,
  handoffSnapshotsEqual,
  mapAuthProfileToOperator,
  mapOperatorProfileRow,
  mapSupabaseUser,
  normalizeHandoffState,
  requestOperatorProfileBootstrap,
  resolveAuthMode,
  resolveAuthOperatorBridge,
  resolveEffectiveOperator,
  resolveHandoffEventTopics,
  HANDOFF_TRANSITION_REASON_LABELS,
  resolveHandoffState,
  resolveOperatorProfileBootstrap,
  resolveOperatorProfileBootstrapStatus,
  resolveOperatorRoleSource,
  shouldShowAuthMockWarning,
  shouldUseMockOperator,
  useAuthSession,
} from "./auth";

export type {
  SupabaseReadinessStatus,
  SupabaseValidationCheck,
  SupabaseValidationCheckId,
  SupabaseValidationCheckOutcome,
  SupabaseValidationReport,
  StagingValidationAuditSnapshot,
  StagingValidationAuthSnapshot,
  StagingValidationEdgeSnapshot,
  RunSupabaseStagingValidationInput,
  SupabaseTableProbeResult,
} from "./staging-validation";
export {
  SUPABASE_READINESS_STATUS_DESCRIPTIONS,
  SUPABASE_READINESS_STATUS_LABELS,
  SUPABASE_VALIDATION_CHECK_LABELS,
  buildSuggestedNextSteps,
  buildValidationReport,
  partitionValidationChecks,
  probeSupabaseTableReadOnly,
  resolveSupabaseReadinessStatus,
  runSupabaseStagingValidation,
} from "./staging-validation";

export type {
  ProductionSafetyAuditSnapshot,
  ProductionSafetyAuthSnapshot,
  ProductionSafetyCheck,
  ProductionSafetyCheckId,
  ProductionSafetyCheckOutcome,
  ProductionSafetyReport,
  ProductionSafetyStatus,
  RunProductionSafetyGateInput,
} from "./production-safety";
export {
  PRODUCTION_SAFETY_CHECK_LABELS,
  PRODUCTION_SAFETY_PENDING_QUEUE_LIMIT,
  PRODUCTION_SAFETY_STATUS_DESCRIPTIONS,
  PRODUCTION_SAFETY_STATUS_LABELS,
  buildProductionSafetyNextSteps,
  buildProductionSafetyReport,
  partitionProductionSafetyChecks,
  resolveProductionSafetyStatus,
  runProductionSafetyGate,
} from "./production-safety";
