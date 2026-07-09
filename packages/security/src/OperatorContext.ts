"use client";

import { createContext } from "react";
import type { ActionAuditLog } from "./ActionAuditLog";
import type { Operator, OperatorRole } from "./SecurityTypes";
import type { SecurityLayer } from "./SecurityLayer";

export type OperatorRoleSource = "mock" | "auth_profile" | "fallback";

export interface OperatorContextValue {
  operator: Operator;
  role: OperatorRole;
  setMockRole: (role: OperatorRole) => void;
  /** False in production — mock role selector must be disabled. */
  mockRoleChangeAllowed: boolean;
  /** Source of the effective operator role. */
  operatorSource: OperatorRoleSource;
  security: SecurityLayer;
  auditLog: ActionAuditLog;
}

export const OperatorContext = createContext<OperatorContextValue | null>(null);
