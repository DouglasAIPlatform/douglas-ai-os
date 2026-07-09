import { actionRequiresConfirmation, getActionPermission } from "./ActionPolicy";
import type { ActionPolicyContext } from "./ActionPolicy";
import { roleHasPermission } from "./Permission";
import type { ActionGuardResult, Operator, SecuredActionType } from "./SecurityTypes";
import { OPERATOR_ROLE_LABELS, PERMISSION_LABELS } from "./SecurityTypes";

export class PermissionGuard {
  evaluate(
    operator: Operator,
    action: SecuredActionType,
    policyContext: ActionPolicyContext = {},
  ): ActionGuardResult {
    const permission = getActionPermission(action);

    if (!roleHasPermission(operator.role, permission)) {
      return {
        allowed: false,
        requiresConfirmation: false,
        blockedByPermission: true,
        permission,
        reason: `Role ${OPERATOR_ROLE_LABELS[operator.role]} não possui permissão: ${PERMISSION_LABELS[permission]}`,
      };
    }

    return {
      allowed: true,
      requiresConfirmation: actionRequiresConfirmation(action, policyContext),
      blockedByPermission: false,
      permission,
    };
  }

  canView(operator: Operator): boolean {
    return roleHasPermission(operator.role, "platform:view");
  }
}

export function createPermissionGuard(): PermissionGuard {
  return new PermissionGuard();
}
