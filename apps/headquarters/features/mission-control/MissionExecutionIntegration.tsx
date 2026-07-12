"use client";

import {
  OperationalAgentRuntime,
  SYSTEM_DIAGNOSTICS_AGENT_ID,
  type OperationalAgentEventPublisher,
} from "@douglas/agents";
import type { AuditAction, AuditEntry } from "@douglas/audit";
import { useAudit } from "@douglas/audit";
import type { EventTopic } from "@douglas/events";
import { useEventBus } from "@douglas/events";
import {
  InMemoryMissionExecutionPersistence,
  MissionExecutionCoordinator,
  MissionManager,
  MissionProvider,
  type MissionExecutionAuditEntry,
} from "@douglas/missions";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { OperationalAgentProvider } from "./OperationalAgentContext";
import { useOperationalSnapshotSource } from "./useOperationalSnapshotSource";

interface MissionExecutionIntegrationProps {
  children: ReactNode;
}

const AGENT_AUDIT_TOPICS: Record<string, AuditAction> = {
  "agent:assigned": "agent_assigned",
  "agent:execution_started": "agent_execution_started",
  "agent:execution_completed": "agent_execution_completed",
  "agent:execution_failed": "agent_execution_failed",
  "agent:execution_cancelled": "agent_execution_cancelled",
  "agent:assignment_rejected": "agent_assignment_rejected",
};

function recordExplicitAudit(
  auditLog: ReturnType<typeof useAudit>["auditLog"],
  entry: MissionExecutionAuditEntry,
): void {
  auditLog.record({
    actor: "mission-execution",
    role: "system",
    source: "missions",
    action: entry.action as AuditAction,
    target: String(entry.metadata.missionId ?? "mission"),
    severity: entry.action.includes("failed") || entry.action.includes("rejected") ? "warning" : "info",
    message: entry.message.slice(0, 240),
    metadata: entry.metadata,
  });
}

function recordAgentAudit(
  auditLog: ReturnType<typeof useAudit>["auditLog"],
  topic: string,
  payload: Record<string, unknown>,
): void {
  const action = AGENT_AUDIT_TOPICS[topic];
  if (!action) return;

  const entry: Omit<AuditEntry, "id" | "timestamp"> = {
    actor: "operational-agent",
    role: "system",
    source: "missions",
    action,
    target: String(payload.agentId ?? "agent"),
    severity:
      topic.includes("failed") || topic.includes("rejected") || topic.includes("cancelled")
        ? "warning"
        : "info",
    message: String(payload.summary ?? payload.reason ?? topic).slice(0, 240),
    metadata: {
      ...payload,
      agentTopic: topic,
      auditPath: "explicit_append",
    },
  };

  auditLog.record(entry);
}

export function MissionExecutionIntegration({ children }: MissionExecutionIntegrationProps) {
  const { publish } = useEventBus();
  const { auditLog } = useAudit();
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
      recordAgentAudit(auditLog, topic, payload);
    },
    [auditLog, publish],
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

  const appendMissionAudit = useCallback(
    (entry: MissionExecutionAuditEntry) => {
      recordExplicitAudit(auditLog, entry);
    },
    [auditLog],
  );

  const coordinator = useMemo(
    () =>
      new MissionExecutionCoordinator({
        manager,
        persistence: new InMemoryMissionExecutionPersistence(),
        agentRuntime,
        snapshotSource,
        publishEvent: publishMissionEvent,
        appendAudit: appendMissionAudit,
      }),
    [agentRuntime, appendMissionAudit, manager, publishMissionEvent, snapshotSource],
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
