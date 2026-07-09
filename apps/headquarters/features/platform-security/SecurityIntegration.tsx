"use client";

import type { EventTopic } from "@douglas/events";
import { useEventBus } from "@douglas/events";
import {
  ActionConfirmationProvider,
  type SecurityActionEventPayload,
} from "@douglas/security";
import type { ReactNode } from "react";
import { useCallback } from "react";
import { AuthOperatorBridge } from "@/features/platform-auth/AuthOperatorBridge";

interface SecurityIntegrationProps {
  children: ReactNode;
}

export function SecurityIntegration({ children }: SecurityIntegrationProps) {
  const { publish } = useEventBus();

  const publishSecurityEvent = useCallback(
    (topic: string, payload: SecurityActionEventPayload) => {
      publish(topic as EventTopic, "authentication", payload, {
        metadata: payload.correlationId
          ? { correlationId: payload.correlationId }
          : payload.requestId
            ? { correlationId: payload.requestId }
            : undefined,
      });
    },
    [publish],
  );

  return (
    <AuthOperatorBridge publishSecurityEvent={publishSecurityEvent}>
      <ActionConfirmationProvider>{children}</ActionConfirmationProvider>
    </AuthOperatorBridge>
  );
}
