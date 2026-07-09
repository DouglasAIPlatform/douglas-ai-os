"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { isMockRoleChangeAllowed } from "./isMockRoleChangeAllowed";
import { OperatorContext, type OperatorRoleSource } from "./OperatorContext";
import { createSecurityLayer, type SecurityLayer } from "./SecurityLayer";
import type { Operator, OperatorRole, SecurityActionEventPayload } from "./SecurityTypes";
import { MOCK_OPERATORS } from "./SecurityTypes";

export interface OperatorProviderProps {
  children: ReactNode;
  initialRole?: OperatorRole;
  /** Optional override from AuthOperatorBridge (auth profile). */
  operatorOverride?: Operator | null;
  operatorSource?: OperatorRoleSource;
  security?: SecurityLayer;
  publishSecurityEvent?: (topic: string, payload: SecurityActionEventPayload) => void;
  /** When omitted, defaults to development-only mock switching. */
  allowMockRoleChange?: boolean;
}

export function OperatorProvider({
  children,
  initialRole = "admin",
  operatorOverride = null,
  operatorSource: operatorSourceProp = "mock",
  security: externalSecurity,
  publishSecurityEvent,
  allowMockRoleChange = isMockRoleChangeAllowed(),
}: OperatorProviderProps) {
  const [mockRole, setMockRoleState] = useState<OperatorRole>(initialRole);

  const security = useMemo(
    () =>
      externalSecurity ??
      createSecurityLayer({
        publish: publishSecurityEvent,
      }),
    [externalSecurity, publishSecurityEvent],
  );

  const mockOperator = useMemo(() => MOCK_OPERATORS[mockRole], [mockRole]);

  const operator = operatorOverride ?? mockOperator;
  const role = operator.role;
  const operatorSource = operatorSourceProp;

  const setMockRole = useCallback(
    (nextRole: OperatorRole) => {
      if (!allowMockRoleChange) {
        return;
      }
      setMockRoleState(nextRole);
    },
    [allowMockRoleChange],
  );

  const value = useMemo(
    () => ({
      operator,
      role,
      setMockRole,
      mockRoleChangeAllowed: allowMockRoleChange,
      operatorSource,
      security,
      auditLog: security.auditLog,
    }),
    [allowMockRoleChange, operator, operatorSource, role, security, setMockRole],
  );

  return (
    <OperatorContext.Provider value={value}>{children}</OperatorContext.Provider>
  );
}
