import type { Permission, SecuredActionType } from "./SecurityTypes";

export const ACTION_PERMISSION_MAP: Record<SecuredActionType, Permission> = {
  refresh_module: "runtime:refresh",
  run_health_check: "runtime:health_check",
  pause_module: "runtime:pause",
  resume_module: "runtime:resume",
  restart_module: "runtime:restart",
};

/** Ações que sempre exigem confirmação explícita, independente de readiness. */
export const SENSITIVE_ACTIONS: SecuredActionType[] = [
  "pause_module",
  "resume_module",
  "restart_module",
];

/** Ações destrutivas sujeitas ao gate de readiness (além de permissão). */
export const DESTRUCTIVE_ACTIONS: SecuredActionType[] = [
  "pause_module",
  "resume_module",
  "restart_module",
];

export function getActionPermission(action: SecuredActionType): Permission {
  return ACTION_PERMISSION_MAP[action];
}

export function isSensitiveAction(action: SecuredActionType): boolean {
  return SENSITIVE_ACTIONS.includes(action);
}

export function isDestructiveAction(action: SecuredActionType): boolean {
  return DESTRUCTIVE_ACTIONS.includes(action);
}

export interface ActionPolicyContext {
  readinessRequiresConfirmation?: boolean;
}

export function actionRequiresConfirmation(
  action: SecuredActionType,
  context: ActionPolicyContext = {},
): boolean {
  if (isSensitiveAction(action)) return true;
  if (context.readinessRequiresConfirmation && isDestructiveAction(action)) return true;
  return false;
}
