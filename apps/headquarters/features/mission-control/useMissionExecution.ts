"use client";

import {
  OPERATIONAL_DIAGNOSTIC_MISSION_TITLE,
  OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
  RELEASE_READINESS_REVIEW_MISSION_TITLE,
  RELEASE_READINESS_REVIEW_MISSION_TYPE,
  abbreviateCorrelationId,
  canPerformMissionExecution,
  missionExecutionAccessReason,
  type MissionExecutionContext,
  type MissionExecutionResult,
  useMissions,
} from "@douglas/missions";
import { useOperator } from "@douglas/security";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RELEASE_READINESS_AGENT_ID,
  SYSTEM_DIAGNOSTICS_AGENT_ID,
  type AgentExecutionReport,
  type AgentSessionMetrics,
  type ReleaseReadinessAgentReport,
} from "@douglas/agents";
import { useOperationalAgent } from "./OperationalAgentContext";
import { useMissionExecutionPersistenceAdapter } from "./MissionExecutionPersistenceContext";
import { useAuthOperatorBridge } from "@/features/platform-auth/useAuthOperatorBridge";

export type MissionExecutionKind = "operational_diagnostic" | "release_readiness_review";

const MISSION_CONFIG: Record<
  MissionExecutionKind,
  { title: string; missionType: string; agentId: string; executeLabel: string }
> = {
  operational_diagnostic: {
    title: OPERATIONAL_DIAGNOSTIC_MISSION_TITLE,
    missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
    agentId: SYSTEM_DIAGNOSTICS_AGENT_ID,
    executeLabel: "Executar diagnóstico",
  },
  release_readiness_review: {
    title: RELEASE_READINESS_REVIEW_MISSION_TITLE,
    missionType: RELEASE_READINESS_REVIEW_MISSION_TYPE,
    agentId: RELEASE_READINESS_AGENT_ID,
    executeLabel: "Executar revisão de readiness",
  },
};

function createExecutionIds(): {
  executionId: string;
  correlationId: string;
  requestId: string;
} {
  const stamp = Date.now();
  return {
    executionId: `exec:${stamp}`,
    correlationId: `corr:${stamp}`,
    requestId: `req:${stamp}`,
  };
}

export function useMissionExecution() {
  const { coordinator, manager, getTimeline, refresh } = useMissions();
  const persistence = useMissionExecutionPersistenceAdapter();
  const { authSession } = useAuthOperatorBridge();
  const {
    getDiagnosticsAgentMetrics,
    getDiagnosticsAgentManifest,
    getLastDiagnosticsReport,
    getDiagnosticsAgentStatus,
    getReleaseReadinessAgentMetrics,
    getReleaseReadinessAgentManifest,
    getLastReleaseReadinessReport,
    getReleaseReadinessAgentStatus,
  } = useOperationalAgent();
  const { operator, role } = useOperator();

  const [missionKind, setMissionKind] = useState<MissionExecutionKind>("operational_diagnostic");
  const [result, setResult] = useState<MissionExecutionResult | null>(null);
  const [context, setContext] = useState<MissionExecutionContext | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentExecutions, setRecentExecutions] = useState<MissionExecutionContext[]>([]);
  const [persistenceEvents, setPersistenceEvents] = useState<
    Awaited<ReturnType<NonNullable<typeof persistence>["listExecutionEvents"]>>
  >([]);
  const [persistenceStatus, setPersistenceStatus] = useState(
    persistence?.getStatus() ?? null,
  );

  const config = MISSION_CONFIG[missionKind];

  useEffect(() => {
    if (!persistence) return;

    const sync = () => {
      setPersistenceStatus(persistence.getStatus());
    };

    sync();
    return persistence.onStatusChange(sync);
  }, [persistence]);

  useEffect(() => {
    if (!persistence) return;

    void (async () => {
      const recent = await persistence.listRecentExecutions(5);
      setRecentExecutions(recent);
      if (recent[0]) {
        const events = await persistence.listExecutionEvents(recent[0].executionId);
        setPersistenceEvents(events);
      }
    })();
  }, [persistence, result?.context?.executionId]);

  const canExecute = canPerformMissionExecution({
    role,
    missionType: config.missionType,
    capability: "execute",
  });

  const canCancel = canPerformMissionExecution({
    role,
    missionType: config.missionType,
    capability: "cancel",
  });

  const canRetry =
    result?.success === false &&
    canPerformMissionExecution({
      role,
      missionType: config.missionType,
      capability: "retry",
    });

  const timeline = context?.missionId != null ? getTimeline(context.missionId) : [];
  const boardMission = context?.missionId != null ? manager.get(context.missionId) : undefined;

  const createRequest = useCallback(
    (ids: ReturnType<typeof createExecutionIds>, retry?: boolean) => {
      if (!coordinator) return null;

      const base = {
        ...ids,
        createdBy: operator.id,
        createdByRole: role,
        createdByUserId: authSession.user?.id,
        isRetry: retry,
        previousExecutionId: retry ? context?.executionId : undefined,
        missionId: retry ? context?.missionId : undefined,
      };

      if (missionKind === "release_readiness_review") {
        return coordinator.createReleaseReadinessRequest(base);
      }

      return coordinator.createDiagnosticRequest(base);
    },
    [authSession.user?.id, context?.executionId, context?.missionId, coordinator, missionKind, operator.id, role],
  );

  const executeMission = useCallback(async () => {
    if (!coordinator) {
      setError("Coordinator indisponível");
      return;
    }

    if (!canExecute) {
      setError(
        missionExecutionAccessReason({
          role,
          missionType: config.missionType,
          capability: "execute",
        }),
      );
      return;
    }

    setError(null);
    setIsRunning(true);

    const request = createRequest(createExecutionIds());
    if (!request) {
      setIsRunning(false);
      return;
    }

    try {
      const executionResult = await coordinator.execute(request);
      setResult(executionResult);
      setContext(executionResult.context);
      refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao executar missão");
    } finally {
      setIsRunning(false);
    }
  }, [canExecute, config.missionType, coordinator, createRequest, refresh, role]);

  const cancelExecution = useCallback(async () => {
    if (!coordinator || !context?.executionId || !canCancel) return;

    setIsRunning(true);
    try {
      const cancelled = await coordinator.cancel(context.executionId, role);
      if (cancelled) {
        setResult(cancelled);
        setContext(cancelled.context);
        refresh();
      }
    } finally {
      setIsRunning(false);
    }
  }, [canCancel, context?.executionId, coordinator, refresh, role]);

  const retryExecution = useCallback(async () => {
    if (!coordinator || !canRetry) return;

    setError(null);
    setIsRunning(true);

    const request = createRequest(createExecutionIds(), true);
    if (!request) {
      setIsRunning(false);
      return;
    }

    try {
      const executionResult = await coordinator.execute(request);
      setResult(executionResult);
      setContext(executionResult.context);
      refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao tentar novamente");
    } finally {
      setIsRunning(false);
    }
  }, [canRetry, coordinator, createRequest, refresh]);

  const retryPersistenceSync = useCallback(async () => {
    if (!persistence || persistenceStatus?.fallbackActive !== true) return;
    await persistence.retryPendingSync();
    setPersistenceStatus(persistence.getStatus());
  }, [persistence, persistenceStatus?.fallbackActive]);

  const agentManifest = useMemo(() => {
    return missionKind === "release_readiness_review"
      ? getReleaseReadinessAgentManifest()
      : getDiagnosticsAgentManifest();
  }, [getDiagnosticsAgentManifest, getReleaseReadinessAgentManifest, missionKind]);

  const agentMetrics: AgentSessionMetrics = useMemo(() => {
    return missionKind === "release_readiness_review"
      ? getReleaseReadinessAgentMetrics()
      : getDiagnosticsAgentMetrics();
  }, [getDiagnosticsAgentMetrics, getReleaseReadinessAgentMetrics, missionKind]);

  const agentReport: AgentExecutionReport | undefined = useMemo(() => {
    return missionKind === "operational_diagnostic" ? getLastDiagnosticsReport() : undefined;
  }, [getLastDiagnosticsReport, missionKind]);

  const releaseReadinessReport: ReleaseReadinessAgentReport | undefined = useMemo(() => {
    return missionKind === "release_readiness_review"
      ? getLastReleaseReadinessReport()
      : undefined;
  }, [getLastReleaseReadinessReport, missionKind]);

  const agentStatus = useMemo(() => {
    return missionKind === "release_readiness_review"
      ? getReleaseReadinessAgentStatus()
      : getDiagnosticsAgentStatus();
  }, [getDiagnosticsAgentStatus, getReleaseReadinessAgentStatus, missionKind]);

  return {
    missionKind,
    setMissionKind,
    title: config.title,
    agentId: config.agentId,
    executeLabel: config.executeLabel,
    agentName: agentManifest?.name ?? config.agentId,
    agentVersion: agentManifest?.version ?? "1.0.0",
    agentCapabilities: agentManifest?.capabilities ?? [],
    agentReadOnly: agentManifest?.readOnly ?? true,
    agentStatus,
    agentMetrics,
    agentReport,
    releaseReadinessReport,
    context,
    result,
    timeline,
    boardMission,
    isRunning,
    error,
    canExecute,
    canCancel,
    canRetry,
    canView: true,
    role,
    operatorName: operator.name,
    abbreviatedCorrelationId: context
      ? abbreviateCorrelationId(context.correlationId)
      : null,
    executeMission,
    executeDiagnostic: executeMission,
    cancelExecution,
    retryExecution,
    retryPersistenceSync,
    persistenceStatus,
    recentExecutions,
    persistenceEvents,
    rehydratedExecution: recentExecutions[0],
  };
}
