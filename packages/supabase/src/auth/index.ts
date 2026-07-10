export type {
  AuthAdapter,
  AuthAdapterSessionResult,
  AuthSignInCredentials,
  AuthSignInResult,
  AuthSignOutResult,
} from "./AuthAdapter";
export {
  AUTH_MODE_LABELS,
  AUTH_OPERATOR_HANDOFF_STATE_LABELS,
  AUTH_PROVIDER_LABELS,
  AUTH_STATUS_LABELS,
  OPERATOR_ROLE_SOURCE_LABELS,
} from "./AuthLabels";
export type {
  AuthMode,
  AuthOperatorBridgeResult,
  AuthOperatorHandoffState,
  AuthProfile,
  AuthProviderKind,
  AuthRole,
  AuthSessionState,
  AuthStatus,
  AuthUser,
  OperatorRoleSource,
} from "./AuthTypes";
export {
  AuthSessionContext,
  DEFAULT_AUTH_SESSION_STATE,
  type AuthSessionContextValue,
} from "./AuthSessionContext";
export {
  AuthSessionProvider,
  type AuthSessionProviderProps,
} from "./AuthSessionProvider";
export { mapOperatorProfileRow } from "./mapOperatorProfile";
export { mapAuthProfileToOperator, type MappedOperator } from "./OperatorProfileMapper";
export {
  allowsInactiveProfileMockFallback,
  isActiveOperatorProfile,
  isBlockedByProfileStatus,
  normalizeHandoffState,
  resolveHandoffState,
  resolveOperatorRoleSource,
  shouldShowAuthMockWarning,
  shouldShowProfileInactiveWarning,
  shouldUseMockOperator,
} from "./OperatorFallbackPolicy";
export {
  resolveEffectiveOperator,
  type EffectiveOperatorResolution,
} from "./EffectiveOperatorResolver";
export { mapSupabaseUser } from "./mapSupabaseUser";
export { resolveAuthMode } from "./resolveAuthMode";
export {
  resolveAuthOperatorBridge,
} from "./resolveAuthOperatorBridge";
export type {
  HandoffEventDedupResult,
  HandoffEventDeduplicatorOptions,
  HandoffEventHistoryOptions,
  HandoffEventKey,
  HandoffEventTopic,
  HandoffRelevantTransition,
  HandoffStateSnapshot,
  HandoffTransition,
  HandoffTransitionReason,
} from "./handoff";
export {
  HANDOFF_EVENT_TOPICS,
  HandoffEventDeduplicator,
  HandoffEventHistory,
  buildHandoffEventKey,
  classifyHandoffTransition,
  createHandoffEventDeduplicator,
  createHandoffStateSnapshot,
  describeHandoffTransition,
  handoffSnapshotFingerprint,
  handoffSnapshotsEqual,
  HANDOFF_TRANSITION_REASON_LABELS,
  resolveHandoffEventTopics,
} from "./handoff";
export {
  createSupabaseAuthAdapter,
} from "./SupabaseAuthAdapter";
export { useAuthSession } from "./useAuthSession";

export type {
  OperatorProfileBootstrapRecommendation,
  OperatorProfileBootstrapReport,
  OperatorProfileBootstrapRequestResult,
  OperatorProfileBootstrapStatus,
  RequestOperatorProfileBootstrapInput,
  ResolveOperatorProfileBootstrapInput,
} from "./bootstrap";
export {
  OPERATOR_PROFILE_BOOTSTRAP_STATUS_DESCRIPTIONS,
  OPERATOR_PROFILE_BOOTSTRAP_STATUS_LABELS,
  buildOperatorProfileBootstrapRecommendation,
  requestOperatorProfileBootstrap,
  resolveOperatorProfileBootstrap,
  resolveOperatorProfileBootstrapStatus,
} from "./bootstrap";
