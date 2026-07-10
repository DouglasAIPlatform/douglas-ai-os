import type { OperatorRole, Permission, SecuredActionType } from "../SecurityTypes";
import type { RBACCapabilityId } from "./RBACPermissionMatrix";

export type RBACVerificationCategory =
  | "permission"
  | "secured_action"
  | "confirmation"
  | "mock_role_policy"
  | "auth_handoff"
  | "role_elevation";

export interface RBACVerificationCase {
  id: string;
  category: RBACVerificationCategory;
  description: string;
  role?: OperatorRole;
  permission?: Permission;
  action?: SecuredActionType;
  capabilityId?: RBACCapabilityId;
  /** Resultado esperado: permitido ou bloqueado. */
  expectedAllowed: boolean;
  /** Quando aplicável, ação permitida deve exigir confirmação. */
  expectedRequiresConfirmation?: boolean;
  tags?: string[];
}
