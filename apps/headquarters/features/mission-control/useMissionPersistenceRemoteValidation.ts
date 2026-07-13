"use client";

import { useAudit } from "@douglas/audit";
import { buildMissionPersistencePayload } from "@douglas/events";
import { useEventBus } from "@douglas/events";
import {
  MissionPersistenceRuntimeValidator,
  evaluateMissionPersistenceFallback,
  type MissionExecutionPersistenceAdapterWithStatus,
  type MissionPersistenceRemoteReport,
  type MissionPersistenceRuntimeValidatorEligibility,
  type MissionPersistenceFallbackEvaluation,
} from "@douglas/missions";
import { useSupabase } from "@douglas/supabase";
import { useOperator } from "@douglas/security";
import { useCallback, useMemo, useState } from "react";
import { useAuthOperatorBridge } from "@/features/platform-auth/useAuthOperatorBridge";
import { useEnvironmentStatus } from "@/features/platform-environment/useEnvironmentStatus";
import { resolveMissionExecutionPersistenceMode } from "./missionExecutionPersistenceConfig";

export type {
  MissionPersistenceRemoteReport,
  MissionPersistenceRuntimeValidatorEligibility,
  MissionPersistenceFallbackEvaluation,
};

export interface MissionPersistenceRemoteValidationState {
  report: MissionPersistenceRemoteReport;
  eligibility: MissionPersistenceRuntimeValidatorEligibility;
  fallbackEvaluation: MissionPersistenceFallbackEvaluation;
  running: boolean;
  remoteConfirmed: boolean;
  runValidation: () => Promise<void>;
}

export function useMissionPersistenceRemoteValidation(
  persistence: MissionExecutionPersistenceAdapterWithStatus | null,
): MissionPersistenceRemoteValidationState {
  const { client } = useSupabase();
  const { authSession, bridge } = useAuthOperatorBridge();
  const { role } = useOperator();
  const { snapshot: envSnapshot } = useEnvironmentStatus();
  const { publish } = useEventBus();
  const { auditLog } = useAudit();

  const [report, setReport] = useState<MissionPersistenceRemoteReport>(() =>
    MissionPersistenceRuntimeValidator.buildUnknownReport(envSnapshot.effectiveEnvironment),
  );
  const [running, setRunning] = useState(false);
  const [remoteConfirmed, setRemoteConfirmed] = useState(false);

  const configuredMode = resolveMissionExecutionPersistenceMode(
    envSnapshot.effectiveEnvironment,
  );
  const health = persistence?.getStatus() ?? {
    enabled: false,
    mode: "session_only" as const,
    activeAdapter: "none" as const,
    supabaseConfigured: false,
    supabaseTableReady: null,
    fallbackActive: false,
    pendingSyncCount: 0,
    lastSyncAt: null,
    lastError: null,
    lastPersistedAt: null,
    lastHydratedAt: null,
  };

  const profileActive = bridge.profileStatus === "active";
  const isAuthenticated = Boolean(authSession.user?.id);

  const validatorInput = useMemo(
    () => ({
      environment: envSnapshot.effectiveEnvironment,
      configuredMode,
      health,
      supabaseClient: client,
      writeMeta: authSession.user?.id
        ? {
            createdByUserId: authSession.user.id,
            operatorProfileId: authSession.profile?.id,
          }
        : undefined,
      role: role ?? "viewer",
      profileActive,
      isAuthenticated,
    }),
    [
      authSession.profile?.id,
      authSession.user?.id,
      bridge.profileStatus,
      client,
      configuredMode,
      envSnapshot.effectiveEnvironment,
      health,
      isAuthenticated,
      profileActive,
      role,
    ],
  );

  const eligibility = useMemo(
    () => MissionPersistenceRuntimeValidator.evaluateEligibility(validatorInput),
    [validatorInput],
  );

  const fallbackEvaluation = useMemo(
    () =>
      evaluateMissionPersistenceFallback({
        environment: envSnapshot.effectiveEnvironment,
        configuredMode,
        effectiveMode: health.mode,
        fallbackActive: health.fallbackActive,
        pendingSyncCount: health.pendingSyncCount,
        remotePersistConfirmed: remoteConfirmed,
      }),
    [
      configuredMode,
      envSnapshot.effectiveEnvironment,
      health.fallbackActive,
      health.mode,
      health.pendingSyncCount,
      remoteConfirmed,
    ],
  );

  const runValidation = useCallback(async () => {
    if (running) {
      return;
    }

    setRunning(true);
    auditLog.record({
      actor: "mission-persistence",
      role: "system",
      source: "missions",
      action: "runtime_action_started",
      target: "remote-validation",
      severity: "info",
      message: "Validação remota de persistência iniciada",
      metadata: { environment: envSnapshot.effectiveEnvironment, audited: true },
    });
    publish(
      "mission:persistence_validation_started",
      "missions",
      buildMissionPersistencePayload({
        executionId: "validation:remote",
        mode: configuredMode,
        adapter: health.activeAdapter,
        summary: "Validação remota iniciada",
        audited: true,
      }),
    );

    try {
      const validator = new MissionPersistenceRuntimeValidator();
      const nextReport = await validator.runSafeAcceptance(validatorInput);
      setReport(nextReport);

      const confirmed = nextReport.status === "passed";
      setRemoteConfirmed(confirmed);

      if (confirmed) {
        auditLog.record({
          actor: "mission-persistence",
          role: "system",
          source: "missions",
          action: "runtime_action_completed",
          target: "remote-validation",
          severity: "info",
          message: nextReport.summary.slice(0, 240),
          metadata: { passedCount: nextReport.passedCount, audited: true },
        });
        publish(
          "mission:persistence_remote_confirmed",
          "missions",
          buildMissionPersistencePayload({
            executionId: "validation:remote",
            mode: configuredMode,
            adapter: health.activeAdapter,
            summary: nextReport.summary,
            audited: true,
          }),
        );
        publish(
          "mission:persistence_validation_passed",
          "missions",
          buildMissionPersistencePayload({
            executionId: "validation:remote",
            mode: configuredMode,
            summary: `${nextReport.passedCount} checks ok`,
            audited: true,
          }),
        );
      } else {
        auditLog.record({
          actor: "mission-persistence",
          role: "system",
          source: "missions",
          action: "runtime_action_failed",
          target: "remote-validation",
          severity: "warning",
          message: nextReport.summary.slice(0, 240),
          metadata: { failedCount: nextReport.failedCount, status: nextReport.status, audited: true },
        });
        publish(
          "mission:persistence_validation_failed",
          "missions",
          buildMissionPersistencePayload({
            executionId: "validation:remote",
            mode: configuredMode,
            summary: nextReport.summary,
            errorCode: nextReport.status,
            audited: true,
          }),
        );
      }
    } finally {
      setRunning(false);
    }
  }, [auditLog, configuredMode, envSnapshot.effectiveEnvironment, health.activeAdapter, publish, running, validatorInput]);

  return {
    report,
    eligibility,
    fallbackEvaluation,
    running,
    remoteConfirmed,
    runValidation,
  };
}
