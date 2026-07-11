"use client";

import {
  OperationalAgentRuntime,
  SYSTEM_DIAGNOSTICS_AGENT_ID,
  type OperationalAgentEventPublisher,
} from "@douglas/agents";
import type { EventTopic } from "@douglas/events";
import { useEventBus } from "@douglas/events";
import {
  InMemoryMissionExecutionPersistence,
  MissionExecutionCoordinator,
  MissionManager,
  MissionProvider,
} from "@douglas/missions";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { OperationalAgentProvider } from "./OperationalAgentContext";
import { useOperationalSnapshotSource } from "./useOperationalSnapshotSource";

interface MissionExecutionIntegrationProps {
  children: ReactNode;
}

export function MissionExecutionIntegration({ children }: MissionExecutionIntegrationProps) {
  const { publish } = useEventBus();
  const snapshotSource = useOperationalSnapshotSource();
  const [manager] = useState(() => new MissionManager());

  const publishAgentEvent: OperationalAgentEventPublisher = useCallback(
    (topic, payload) => {
      publish(topic as EventTopic, "agents", payload, {
        metadata:
          typeof payload.correlationId === "string"
            ? { correlationId: payload.correlationId }
            : undefined,
      });
    },
    [publish],
  );

  const agentRuntime = useMemo(
    () => new OperationalAgentRuntime({ publish: publishAgentEvent }),
    [publishAgentEvent],
  );

  const publishMissionEvent = useCallback(
    (topic: EventTopic, payload: Parameters<typeof publish>[2]) => {
      publish(topic, "missions", payload, {
        metadata:
          "correlationId" in payload && typeof payload.correlationId === "string"
            ? { correlationId: payload.correlationId }
            : undefined,
      });
    },
    [publish],
  );

  const coordinator = useMemo(
    () =>
      new MissionExecutionCoordinator({
        manager,
        persistence: new InMemoryMissionExecutionPersistence(),
        agentRuntime,
        snapshotSource,
        publishEvent: publishMissionEvent,
        appendAudit: () => {},
      }),
    [agentRuntime, manager, publishMissionEvent, snapshotSource],
  );

  return (
    <OperationalAgentProvider agentRuntime={agentRuntime}>
      <MissionProvider manager={manager} coordinator={coordinator}>
        {children}
      </MissionProvider>
    </OperationalAgentProvider>
  );
}

export { SYSTEM_DIAGNOSTICS_AGENT_ID };
