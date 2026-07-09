"use client";

import type { OperationalActionAvailability } from "@douglas/command-center";
import {
  type SecuredActionType,
  useOperator,
} from "@douglas/security";
import { useMemo } from "react";
import { useOperationalCommandCenter } from "@/features/operational-command-center";

export interface SecuredActionAvailability extends OperationalActionAvailability {
  blockedByPermission: boolean;
  permissionAllowed: boolean;
  securityRequiresConfirmation: boolean;
}

export function useSecuredRuntimeActions(): {
  actions: SecuredActionAvailability[];
} {
  const command = useOperationalCommandCenter();
  const { operator, security } = useOperator();

  const actions = useMemo(() => {
    return command.actionAvailability.map((entry) => {
      const guard = security.evaluateAction(operator, entry.moduleId, entry.action, {
        readinessRequiresConfirmation: entry.requiresConfirmation,
      });

      const permissionBlocked = guard.blockedByPermission;
      const available = entry.available && guard.allowed && !permissionBlocked;

      const requiresConfirmation =
        available && (guard.requiresConfirmation || entry.requiresConfirmation);

      let reason = entry.reason;
      if (permissionBlocked) {
        reason = guard.reason;
      } else if (!entry.available && entry.reason) {
        reason = entry.reason;
      } else if (requiresConfirmation && available) {
        reason = guard.reason ?? entry.reason ?? "Confirmação necessária";
      }

      return {
        ...entry,
        available,
        requiresConfirmation,
        blockedByPermission: permissionBlocked,
        permissionAllowed: guard.allowed,
        securityRequiresConfirmation: guard.requiresConfirmation,
        reason,
      };
    });
  }, [command.actionAvailability, operator, security]);

  return { actions };
}

export function findSecuredAction(
  actions: SecuredActionAvailability[],
  moduleId: string,
  action: SecuredActionType,
) {
  return actions.find((entry) => entry.moduleId === moduleId && entry.action === action);
}
