"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActionConfirmationContext } from "./ActionConfirmationContext";
import { ActionConfirmationModal } from "./ActionConfirmationModal";
import type {
  ActionConfirmationRequest,
  ActionConfirmationRequestInput,
  ActionConfirmationResult,
} from "./SecurityTypes";
import { useOperator } from "./useOperator";

export interface ActionConfirmationProviderProps {
  children: ReactNode;
}

export function ActionConfirmationProvider({ children }: ActionConfirmationProviderProps) {
  const { operator, security } = useOperator();
  const [pending, setPending] = useState<ActionConfirmationRequest | null>(null);
  const resolverRef = useRef<((result: ActionConfirmationResult) => void) | null>(null);

  const requestConfirmation = useCallback(
    (input: ActionConfirmationRequestInput): Promise<ActionConfirmationResult> => {
      if (pending) {
        return Promise.resolve({
          requestId: pending.id,
          confirmed: false,
          resolvedAt: new Date().toISOString(),
        });
      }

      const request = security.confirmation.createRequest(operator.id, input);
      security.recordConfirmationRequested(operator, request);
      setPending(request);

      return new Promise<ActionConfirmationResult>((resolve) => {
        resolverRef.current = resolve;
      });
    },
    [operator, pending, security],
  );

  const resolvePending = useCallback(
    (confirmed: boolean) => {
      if (!pending) return;

      const result = security.confirmation.resolve(pending.id, confirmed);

      if (confirmed) {
        security.recordConfirmed(operator, pending.moduleId, pending.action, {
          requestId: pending.id,
          correlationId: pending.id,
        });
      } else {
        security.recordCancelled(operator, pending.moduleId, pending.action, {
          requestId: pending.id,
          correlationId: pending.id,
        });
      }

      resolverRef.current?.(result);
      resolverRef.current = null;
      setPending(null);
    },
    [operator, pending, security],
  );

  const handleConfirm = useCallback(() => resolvePending(true), [resolvePending]);
  const handleCancel = useCallback(() => resolvePending(false), [resolvePending]);

  const value = useMemo(
    () => ({
      pending,
      requestConfirmation,
    }),
    [pending, requestConfirmation],
  );

  return (
    <ActionConfirmationContext.Provider value={value}>
      {children}
      {pending ? (
        <ActionConfirmationModal
          request={pending}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      ) : null}
    </ActionConfirmationContext.Provider>
  );
}
