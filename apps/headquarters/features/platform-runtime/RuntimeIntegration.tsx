"use client";

import { usePlatformBootstrap } from "@douglas/bootstrap";
import type { EventTopic } from "@douglas/events";
import { useEventBus } from "@douglas/events";
import {
  RuntimeControlProvider,
  RuntimeProvider,
  type RuntimeActionEventPayload,
} from "@douglas/runtime";
import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import {
  createRuntimeEventBusAdapter,
  platformRuntimeOptions,
} from "@/features/platform-runtime";
import { HealthIntegration } from "@/features/platform-health/HealthIntegration";
import { AuditIntegration } from "@/features/platform-audit";
import { SecurityIntegration } from "@/features/platform-security/SecurityIntegration";
import { MissionExecutionIntegration } from "@/features/mission-control/MissionExecutionIntegration";
import { platformVersion } from "@/lib/mock-data";

interface RuntimeIntegrationProps {
  children: ReactNode;
}

export function RuntimeIntegration({ children }: RuntimeIntegrationProps) {
  const { isReady } = usePlatformBootstrap();
  const { bus, publish } = useEventBus();

  const runtimeEventBus = useMemo(
    () => createRuntimeEventBusAdapter(bus),
    [bus],
  );

  const publishActionEvent = useCallback(
    (topic: string, payload: RuntimeActionEventPayload) => {
      publish(
        topic as EventTopic,
        "runtime",
        payload as Parameters<typeof publish>[2],
      );
    },
    [publish],
  );

  return (
    <RuntimeProvider
      enabled={isReady}
      platformVersion={platformVersion}
      modules={platformRuntimeOptions.modules}
      eventBus={runtimeEventBus}
    >
      <RuntimeControlProvider publishActionEvent={publishActionEvent}>
        <SecurityIntegration>
          <AuditIntegration>
            <HealthIntegration>
              <MissionExecutionIntegration>{children}</MissionExecutionIntegration>
            </HealthIntegration>
          </AuditIntegration>
        </SecurityIntegration>
      </RuntimeControlProvider>
    </RuntimeProvider>
  );
}
