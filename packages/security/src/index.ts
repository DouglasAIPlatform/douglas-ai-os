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
  canExecuteRuntimeActions,
  canViewPlatform,
  getRolePermissions,
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
export { isMockRoleChangeAllowed } from "./isMockRoleChangeAllowed";
