"use client";

import type { AuthOperatorHandoffEventPayload } from "@douglas/events";
import { useEventBus } from "@douglas/events";
import {
  OperatorProvider,
  type SecurityActionEventPayload,
} from "@douglas/security";
import {
  createHandoffEventDeduplicator,
  createHandoffStateSnapshot,
  normalizeHandoffState,
  resolveEffectiveOperator,
  useAuthSession,
  type HandoffRelevantTransition,
} from "@douglas/supabase";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { HandoffEventBridgeContext } from "./HandoffEventBridgeContext";

interface AuthOperatorBridgeProps {
  children: ReactNode;
  publishSecurityEvent?: (topic: string, payload: SecurityActionEventPayload) => void;
}

function buildHandoffPayload(
  resolution: ReturnType<typeof resolveEffectiveOperator>,
  userId?: string,
  message?: string,
): AuthOperatorHandoffEventPayload {
  const state = normalizeHandoffState(resolution.handoffState);

  return {
    handoffState: resolution.handoffState,
    operatorSource: resolution.operatorSource,
    userId,
    operatorId: resolution.operatorOverride?.id,
    operatorRole: resolution.effectiveRole,
    message:
      message ??
      (state === "profile_missing"
        ? "Sessão autenticada sem operator_profiles — fallback mock ativo"
        : state === "profile_error"
          ? "Erro de auth/profile — fallback mock ativo"
          : state === "authenticated_with_active_profile"
            ? "Operador efetivo derivado do operator profile ativo"
            : state === "authenticated_with_inactive_profile"
              ? "Profile inativo — fallback mock em development"
              : state === "blocked_by_profile_status"
                ? "Profile inativo — operador bloqueado"
                : undefined),
  };
}

/**
 * Connects AuthSessionProvider to OperatorProvider with optional profile override
 * and publishes auth:operator:handoff_* events on idempotent lifecycle transitions.
 */
export function AuthOperatorBridge({
  children,
  publishSecurityEvent,
}: AuthOperatorBridgeProps) {
  const authSession = useAuthSession();
  const { publish } = useEventBus();

  const resolution = useMemo(
    () => resolveEffectiveOperator(authSession, "admin"),
    [authSession],
  );

  const deduplicatorRef = useRef(createHandoffEventDeduplicator());
  const [lastRelevantTransition, setLastRelevantTransition] =
    useState<HandoffRelevantTransition | null>(null);

  useEffect(() => {
    const snapshot = createHandoffStateSnapshot(resolution, authSession.user?.id);
    const result = deduplicatorRef.current.evaluate(snapshot, {
      authLoading: authSession.status === "loading",
    });

    if (result.transition) {
      setLastRelevantTransition(result.transition);
    }

    if (result.topicsToEmit.length === 0) {
      return;
    }

    const payload = buildHandoffPayload(
      resolution,
      authSession.user?.id,
      result.transition?.message,
    );

    for (const topic of result.topicsToEmit) {
      publish(topic, "authentication", payload);
    }
  }, [authSession.status, authSession.user?.id, publish, resolution]);

  const handoffBridgeValue = useMemo(
    () => ({ lastRelevantTransition }),
    [lastRelevantTransition],
  );

  return (
    <HandoffEventBridgeContext.Provider value={handoffBridgeValue}>
      <OperatorProvider
        operatorOverride={resolution.operatorOverride}
        operatorSource={resolution.operatorSource}
        publishSecurityEvent={publishSecurityEvent}
      >
        {children}
      </OperatorProvider>
    </HandoffEventBridgeContext.Provider>
  );
}
