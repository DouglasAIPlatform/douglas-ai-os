"use client";

import {
  OperationalAgentRuntime,
  SYSTEM_DIAGNOSTICS_AGENT_ID,
  type OperationalAgentEventPublisher,
} from "@douglas/agents";
import type { AuditAction, AuditEntry } from "@douglas/audit";
import { useAudit } from "@douglas/audit";
import { buildAgentHistoryEventPayload, buildMissionPersistencePayload } from "@douglas/events";
import type { EventTopic } from "@douglas/events";
import { useEventBus } from "@douglas/events";
import {
  MissionExecutionCoordinator,
  MissionManager,
  MissionProvider,
  SessionMissionExecutionPersistence,
  createCompositeAgentExecutionHistoryRepository,
  createCompositeMissionExecutionPersistence,
  isMissionExecutionPersistenceWithStatus,
  rehydrateMissionExecutions,
  type MissionExecutionAuditEntry,
} from "@douglas/missions";
import { useSupabase } from "@douglas/supabase";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AgentExecutionHistoryProvider } from "@/features/agents/AgentExecutionHistoryContext";
import { useAuthOperatorBridge } from "@/features/platform-auth/useAuthOperatorBridge";
import { OperationalAgentProvider } from "./OperationalAgentContext";
import {
  MissionExecutionPersistenceWithRemoteValidation,
  MissionExecutionStagingAcceptanceBridge,
} from "./MissionExecutionPersistenceWithRemoteValidation";
import {
  buildMissionExecutionPersistenceConfig,
  missionExecutionSessionStorageKey,
} from "./missionExecutionPersistenceConfig";
import { useOperationalSnapshotSource } from "./useOperationalSnapshotSource";
import { useReleaseReadinessSnapshotSource } from "./useReleaseReadinessSnapshotSource";
import { useEnvironmentStatus } from "@/features/platform-environment/useEnvironmentStatus";

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
  const { client, config } = useSupabase();
  const { authSession } = useAuthOperatorBridge();
  const snapshotSource = useOperationalSnapshotSource();
  const { snapshot: envSnapshot } = useEnvironmentStatus();
  const [manager] = useState(() => new MissionManager());
  const [, setPersistenceReady] = useState(false);

  const persistence = useMemo(
    () =>
      createCompositeMissionExecutionPersistence(
        client,
        buildMissionExecutionPersistenceConfig({
          supabaseClient: client,
          isSupabaseConfigured: config.isConfigured,
          createdByUserId: authSession.user?.id,
          effectiveEnvironment: envSnapshot.effectiveEnvironment,
        }),
      ),
    [authSession.user?.id, client, config.isConfigured, envSnapshot.effectiveEnvironment],
  );

  const sessionReader = useMemo(
    () => new SessionMissionExecutionPersistence(missionExecutionSessionStorageKey),
    [],
  );

  const historyRepository = useMemo(
    () =>
      createCompositeAgentExecutionHistoryRepository({
        listSessionContexts: () => sessionReader.list(),
        listByAgent: (agentId, limit, offset) =>
          isMissionExecutionPersistenceWithStatus(persistence)
            ? persistence.listExecutionsByAgent(agentId, limit, offset)
            : Promise.resolve([]),
        listRecent: (limit) =>
          isMissionExecutionPersistenceWithStatus(persistence)
            ? persistence.listRecentExecutions(limit)
            : Promise.resolve([]),
        dataSource:
          isMissionExecutionPersistenceWithStatus(persistence) &&
          persistence.getStatus().activeAdapter === "supabase"
            ? "supabase"
            : "composite",
      }),
    [persistence, sessionReader],
  );

  const publishPersistenceEvent = useCallback(
    (topic: EventTopic, executionId: string, extra: Record<string, unknown> = {}) => {
      publish(
        topic,
        "missions",
        buildMissionPersistencePayload({
          executionId,
          ...extra,
          audited: true,
        }),
      );
    },
    [publish],
  );

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

  const releaseReadinessSnapshotSource = useReleaseReadinessSnapshotSource(agentRuntime);

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
        persistence,
        agentRuntime,
        snapshotSource,
        releaseReadinessSnapshotSource,
        publishEvent: publishMissionEvent,
        appendAudit: appendMissionAudit,
      }),
    [
      agentRuntime,
      appendMissionAudit,
      manager,
      persistence,
      publishMissionEvent,
      releaseReadinessSnapshotSource,
      snapshotSource,
    ],
  );

  useEffect(() => {
    if (!isMissionExecutionPersistenceWithStatus(persistence)) return;

    let cancelled = false;

    void (async () => {
      await persistence.initialize();
      const result = await rehydrateMissionExecutions({
        listRecentExecutions: (limit) => persistence.listRecentExecutions(limit),
        listExecutionEvents: (executionId) => persistence.listExecutionEvents(executionId),
        registry: coordinator.getRegistry(),
        limit: 10,
      });

      if (cancelled) return;

      if (result.rehydratedCount > 0) {
        publishPersistenceEvent(
          "mission:persistence_rehydrated",
          result.latestExecution?.executionId ?? "unknown",
          {
            rehydratedCount: result.rehydratedCount,
            summary: `${result.rehydratedCount} execução(ões) reidratada(s)`,
          },
        );
      }

      for (const decision of result.recoveryDecisions) {
        if (decision.shouldEmitRecoveryRequired && result.latestExecution) {
          publishPersistenceEvent("mission:recovery_required", result.latestExecution.executionId, {
            summary: decision.reason,
            errorCode: decision.action,
          });
        }
      }

      const status = persistence.getStatus();
      if (status.fallbackActive) {
        publishPersistenceEvent(
          "mission:persistence_fallback",
          result.latestExecution?.executionId ?? "none",
          {
            mode: status.mode,
            adapter: status.activeAdapter,
            pendingCount: status.pendingSyncCount,
            summary: status.lastError ?? "Fallback sessionStorage ativo",
          },
        );
      }

      setPersistenceReady(true);

      try {
        const snapshot = await historyRepository.getAgentMetrics(
          SYSTEM_DIAGNOSTICS_AGENT_ID,
          "combined",
        );
        publish(
          "agent:history_rehydrated",
          "agents",
          buildAgentHistoryEventPayload({
            agentId: SYSTEM_DIAGNOSTICS_AGENT_ID,
            entryCount: snapshot.metrics.totalExecutions,
            dataSource: snapshot.dataSource,
            summary: `${snapshot.metrics.totalExecutions} execução(ões) no histórico`,
            audited: true,
          }),
        );
      } catch {
        // Histórico indisponível não bloqueia missões.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [coordinator, historyRepository, persistence, publish, publishPersistenceEvent]);

  return (
    <OperationalAgentProvider agentRuntime={agentRuntime}>
      <MissionExecutionPersistenceWithRemoteValidation persistence={persistence}>
        <AgentExecutionHistoryProvider repository={historyRepository}>
          <MissionExecutionStagingAcceptanceBridge>
            <MissionProvider manager={manager} coordinator={coordinator}>
              {children}
            </MissionProvider>
          </MissionExecutionStagingAcceptanceBridge>
        </AgentExecutionHistoryProvider>
      </MissionExecutionPersistenceWithRemoteValidation>
    </OperationalAgentProvider>
  );
}

export { SYSTEM_DIAGNOSTICS_AGENT_ID };
