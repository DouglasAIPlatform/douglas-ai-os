"use client";

import {
  resolveAuthOperatorBridge,
  useAuthSession,
} from "@douglas/supabase";
import { useOperator } from "@douglas/security";
import { useMemo } from "react";

export function useAuthOperatorBridge() {
  const authSession = useAuthSession();
  const { role: mockRole, operator, operatorSource, mockRoleChangeAllowed } = useOperator();

  const bridge = useMemo(
    () => resolveAuthOperatorBridge(authSession, mockRole),
    [authSession, mockRole],
  );

  return useMemo(
    () => ({
      authSession,
      operator,
      bridge,
      operatorSource,
      mockRoleChangeAllowed,
    }),
    [authSession, bridge, mockRoleChangeAllowed, operator, operatorSource],
  );
}
