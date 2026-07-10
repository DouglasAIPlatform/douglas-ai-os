import {
  ACTION_PERMISSION_MAP,
  SENSITIVE_ACTIONS,
  type ActionPolicyContext,
} from "../ActionPolicy";
import { ROLE_PERMISSIONS, roleHasPermission } from "../Permission";
import type { OperatorRole, Permission, SecuredActionType } from "../SecurityTypes";

/**
 * Capabilities verificáveis derivadas do catálogo real (@douglas/security).
 * Nomes alinhados às ações expostas na plataforma — sem permissões inventadas.
 */
export type RBACCapabilityId =
  | "view_platform"
  | "view_audit_trail"
  | "runtime_refresh"
  | "runtime_health_check"
  | "runtime_pause"
  | "runtime_resume"
  | "runtime_restart"
  | "execute_operational_runtime"
  | "execute_administrative_runtime"
  | "confirm_sensitive_runtime_action";

export interface RBACMatrixEntry {
  capabilityId: RBACCapabilityId;
  label: string;
  permission: Permission;
  action?: SecuredActionType;
  /** Roles com permissão explícita no catálogo ROLE_PERMISSIONS. */
  rolesAllowed: OperatorRole[];
  requiresConfirmation: boolean;
  /** Documentação de limitações conhecidas (ex.: sem RBAC client-side ainda). */
  clientSideOnly: boolean;
}

const ALL_ROLES: OperatorRole[] = ["owner", "admin", "operator", "viewer"];

function rolesWithPermission(permission: Permission): OperatorRole[] {
  return ALL_ROLES.filter((role) => roleHasPermission(role, permission));
}

function buildEntry(
  capabilityId: RBACCapabilityId,
  label: string,
  permission: Permission,
  options: {
    action?: SecuredActionType;
    requiresConfirmation?: boolean;
  } = {},
): RBACMatrixEntry {
  const action = options.action;
  return {
    capabilityId,
    label,
    permission,
    action,
    rolesAllowed: rolesWithPermission(permission),
    requiresConfirmation:
      options.requiresConfirmation ??
      (action ? SENSITIVE_ACTIONS.includes(action) : false),
    clientSideOnly: true,
  };
}

/** Matriz canônica — derivada de ROLE_PERMISSIONS + ACTION_PERMISSION_MAP. */
export const RBAC_PERMISSION_MATRIX: RBACMatrixEntry[] = [
  buildEntry("view_platform", "Visualizar plataforma", "platform:view"),
  buildEntry(
    "view_audit_trail",
    "Visualizar audit trail (requer platform:view)",
    "platform:view",
  ),
  buildEntry("runtime_refresh", "Refresh de módulo", "runtime:refresh", {
    action: "refresh_module",
  }),
  buildEntry("runtime_health_check", "Health check de módulo", "runtime:health_check", {
    action: "run_health_check",
  }),
  buildEntry("runtime_pause", "Pausar módulo", "runtime:pause", {
    action: "pause_module",
    requiresConfirmation: true,
  }),
  buildEntry("runtime_resume", "Retomar módulo", "runtime:resume", {
    action: "resume_module",
    requiresConfirmation: true,
  }),
  buildEntry("runtime_restart", "Reiniciar módulo", "runtime:restart", {
    action: "restart_module",
    requiresConfirmation: true,
  }),
  buildEntry(
    "execute_operational_runtime",
    "Operações runtime operacionais (refresh + health check)",
    "runtime:refresh",
  ),
  buildEntry(
    "execute_administrative_runtime",
    "Operações runtime administrativas (pause/resume/restart)",
    "runtime:pause",
    {
      action: "pause_module",
      requiresConfirmation: true,
    },
  ),
  buildEntry(
    "confirm_sensitive_runtime_action",
    "Confirmação de ação sensível (pause/resume/restart)",
    "runtime:pause",
    {
      action: "pause_module",
      requiresConfirmation: true,
    },
  ),
];

/** Permissões reservadas exclusivamente ao owner — vazio enquanto owner ≡ admin no catálogo. */
export const OWNER_EXCLUSIVE_PERMISSIONS: Permission[] = ALL_ROLES.flatMap((role) =>
  ROLE_PERMISSIONS[role].filter(
    (permission) =>
      roleHasPermission("owner", permission) && !roleHasPermission("admin", permission),
  ),
);

export function matrixEntryForCapability(
  capabilityId: RBACCapabilityId,
): RBACMatrixEntry | undefined {
  return RBAC_PERMISSION_MATRIX.find((entry) => entry.capabilityId === capabilityId);
}

export function isRoleAllowedForCapability(
  role: OperatorRole,
  capabilityId: RBACCapabilityId,
): boolean {
  const entry = matrixEntryForCapability(capabilityId);
  if (!entry) {
    return false;
  }
  return entry.rolesAllowed.includes(role);
}

export function securedActionsFromMatrix(): SecuredActionType[] {
  return Object.keys(ACTION_PERMISSION_MAP) as SecuredActionType[];
}

export function policyContextForConfirmation(): ActionPolicyContext {
  return { readinessRequiresConfirmation: true };
}
