export type {
  ActionAuditEntry,
  ActionConfirmationRequest,
  ActionConfirmationRequestInput,
  ActionConfirmationResult,
  ActionConfirmationRiskLevel,
  ActionGuardResult,
  Operator,
  OperatorRole,
  Permission,
  PermissionCheckResult,
  SecuredActionType,
  SecurityActionEventPayload,
  SecurityRecordExtras,
} from "./SecurityTypes";

export {
  ACTION_CONFIRMATION_RISK_LABELS,
  MOCK_OPERATORS,
  OPERATOR_ROLE_LABELS,
  PERMISSION_LABELS,
  SECURITY_EVENT_TOPICS,
} from "./SecurityTypes";

export {
  ROLE_PERMISSIONS,
  OWNER_EXCLUSIVE_PERMISSIONS,
  canExecuteRuntimeActions,
  canViewPlatform,
  getRolePermissions,
  roleHasOwnerExclusivePermission,
  roleHasPermission,
} from "./Permission";

export {
  ACTION_PERMISSION_MAP,
  DESTRUCTIVE_ACTIONS,
  SENSITIVE_ACTIONS,
  actionRequiresConfirmation,
  getActionPermission,
  isDestructiveAction,
  isSensitiveAction,
  type ActionPolicyContext,
} from "./ActionPolicy";

export { PermissionGuard, createPermissionGuard } from "./PermissionGuard";
export { ActionConfirmation, createActionConfirmation } from "./ActionConfirmation";
export { buildActionConfirmationInput } from "./ActionConfirmationPolicy";
export { ActionAuditLog, createActionAuditLog } from "./ActionAuditLog";
export { SecurityLayer, createSecurityLayer, type SecurityLayerOptions } from "./SecurityLayer";

export {
  ActionConfirmationContext,
  type ActionConfirmationContextValue,
} from "./ActionConfirmationContext";
export {
  ActionConfirmationProvider,
  type ActionConfirmationProviderProps,
} from "./ActionConfirmationProvider";
export {
  ActionConfirmationModal,
  type ActionConfirmationModalProps,
} from "./ActionConfirmationModal";
export { useActionConfirmation } from "./useActionConfirmation";

export { OperatorContext, type OperatorContextValue, type OperatorRoleSource } from "./OperatorContext";
export { OperatorProvider, type OperatorProviderProps } from "./OperatorProvider";
export { useOperator } from "./useOperator";
export { isMockRoleChangeAllowed, resolveMockRoleChangeAllowed } from "./isMockRoleChangeAllowed";

export type { ServerPermission } from "./server-authorization/ServerPermission";
export { SERVER_PERMISSIONS, isServerPermission } from "./server-authorization/ServerPermission";

export type { ServerAuthorizationContext } from "./server-authorization/ServerAuthorizationContext";

export type {
  ServerAuthorizationDecision,
  ServerAuthorizationOutcome,
} from "./server-authorization/ServerAuthorizationDecision";
export {
  allowServerAuthorization,
  denyServerAuthorization,
} from "./server-authorization/ServerAuthorizationDecision";

export type { ServerAuthorizationReason } from "./server-authorization/ServerAuthorizationReason";
export { SERVER_AUTHORIZATION_REASON_LABELS } from "./server-authorization/ServerAuthorizationReason";

export type { OperatorAuthorizationSnapshot } from "./server-authorization/OperatorAuthorizationSnapshot";

export {
  SERVER_ROLE_PERMISSIONS,
  serverRoleHasPermission,
  getServerRolePermissions,
  canIngestAuditRemotely,
  assertServerCatalogAlignedWithClient,
  EXPECTED_SQL_PERMISSION_SEED,
} from "./server-authorization/ServerPermissionCatalog";

export {
  buildOperatorAuthorizationSnapshot,
  evaluateServerPermission,
  evaluateAuditIngestServerAuthorization,
  toServerAuthorizationContext,
  type EvaluateServerAuthorizationInput,
} from "./server-authorization/ServerAuthorizationEvaluator";

export {
  RBAC_PERMISSION_MATRIX,
  isRoleAllowedForCapability,
  matrixEntryForCapability,
  securedActionsFromMatrix,
  type RBACCapabilityId,
  type RBACMatrixEntry,
} from "./rbac-verification/RBACPermissionMatrix";
export type {
  RBACVerificationCase,
  RBACVerificationCategory,
} from "./rbac-verification/RBACVerificationCase";
export type { RBACVerificationResult } from "./rbac-verification/RBACVerificationResult";
export {
  buildRBACVerificationReport,
  type RBACVerificationReport,
  type RBACVerificationStatus,
} from "./rbac-verification/RBACVerificationReport";
export {
  buildRBACVerificationCases,
  formatRBACVerificationReport,
  runRBACVerification,
} from "./rbac-verification/RBACVerificationRunner";
