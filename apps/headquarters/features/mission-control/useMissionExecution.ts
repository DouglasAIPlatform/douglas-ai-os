"use client";

import {
  OPERATIONAL_DIAGNOSTIC_MISSION_TITLE,
  OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
  abbreviateCorrelationId,
  canPerformMissionExecution,
  missionExecutionAccessReason,
  type MissionExecutionContext,
  type MissionExecutionResult,
  useMissions,
} from "@douglas/missions";
import { useOperator } from "@douglas/security";
import { useCallback, useState } from "react";
import {
  SYSTEM_DIAGNOSTICS_AGENT_ID,
  type AgentExecutionReport,
  type AgentSessionMetrics,
} from "@douglas/agents";
import { useOperationalAgent } from "./OperationalAgentContext";

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
  const {
    getDiagnosticsAgentMetrics,
    getDiagnosticsAgentManifest,
    getLastDiagnosticsReport,
    getDiagnosticsAgentStatus,
  } = useOperationalAgent();
  const { operator, role } = useOperator();
  const [result, setResult] = useState<MissionExecutionResult | null>(null);
  const [context, setContext] = useState<MissionExecutionContext | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canExecute = canPerformMissionExecution({
    role,
    missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
    capability: "execute",
  });

  const canCancel = canPerformMissionExecution({
    role,
    missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
    capability: "cancel",
  });

  const canRetry =
    result?.success === false &&
    canPerformMissionExecution({
      role,
      missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
      capability: "retry",
    });

  const timeline =
    context?.missionId != null ? getTimeline(context.missionId) : [];

  const boardMission =
    context?.missionId != null ? manager.get(context.missionId) : undefined;

  const executeDiagnostic = useCallback(async () => {
    if (!coordinator) {
      setError("Coordinator indisponível");
      return;
    }

    if (!canExecute) {
      setError(
        missionExecutionAccessReason({
          role,
          missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
          capability: "execute",
        }),
      );
      return;
    }

    setError(null);
    setIsRunning(true);

    const ids = createExecutionIds();
    const request = coordinator.createDiagnosticRequest({
      ...ids,
      createdBy: operator.id,
      createdByRole: role,
    });

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
  }, [canExecute, coordinator, operator.id, refresh, role]);

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

    const ids = createExecutionIds();
    const request = coordinator.createDiagnosticRequest({
      ...ids,
      createdBy: operator.id,
      createdByRole: role,
      isRetry: true,
      previousExecutionId: context?.executionId,
      missionId: context?.missionId,
    });

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
  }, [canRetry, context?.executionId, context?.missionId, coordinator, operator.id, refresh, role]);

  const agentMetrics: AgentSessionMetrics = getDiagnosticsAgentMetrics();
  const agentManifest = getDiagnosticsAgentManifest();
  const agentReport: AgentExecutionReport | undefined = getLastDiagnosticsReport();
  const agentStatus = getDiagnosticsAgentStatus();

  return {
    title: OPERATIONAL_DIAGNOSTIC_MISSION_TITLE,
    agentId: SYSTEM_DIAGNOSTICS_AGENT_ID,
    agentName: agentManifest?.name ?? "System Diagnostics Agent",
    agentVersion: agentManifest?.version ?? "1.0.0",
    agentCapabilities: agentManifest?.capabilities ?? [],
    agentReadOnly: agentManifest?.readOnly ?? true,
    agentStatus,
    agentMetrics,
    agentReport,
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
    executeDiagnostic,
    cancelExecution,
    retryExecution,
  };
}
