"use client";

import { useAudit } from "@douglas/audit";
import { buildMissionPersistencePayload } from "@douglas/events";
import { useEventBus } from "@douglas/events";
import {
  StagingPersistenceAcceptanceSuite,
  clearAcceptanceContinuationState,
  loadAcceptanceContinuationState,
  type MissionExecutionContext,
  type MissionExecutionPersistenceAdapterWithStatus,
  type StagingPersistenceAcceptanceReport,
  type StagingPersistenceAcceptanceEligibility,
  type AcceptanceReloadCheckpoint,
} from "@douglas/missions";
import { useSupabase } from "@douglas/supabase";
import { useOperator } from "@douglas/security";
import { useCallback, useMemo, useState } from "react";
import { useAuthOperatorBridge } from "@/features/platform-auth/useAuthOperatorBridge";
import { useEnvironmentStatus } from "@/features/platform-environment/useEnvironmentStatus";
import { useAgentExecutionHistoryRepository } from "@/features/agents/AgentExecutionHistoryContext";
import { resolveMissionExecutionPersistenceMode } from "./missionExecutionPersistenceConfig";

export type {
  StagingPersistenceAcceptanceReport,
  StagingPersistenceAcceptanceEligibility,
  AcceptanceReloadCheckpoint,
};

export interface StagingPersistenceAcceptanceState {
  report: StagingPersistenceAcceptanceReport;
  eligibility: StagingPersistenceAcceptanceEligibility;
  checkpoint: AcceptanceReloadCheckpoint | null;
  running: boolean;
  startAcceptance: () => Promise<void>;
  resumeAfterReload: () => Promise<void>;
  resetAcceptance: () => void;
}

export function useStagingPersistenceAcceptance(
  persistence: MissionExecutionPersistenceAdapterWithStatus | null,
): StagingPersistenceAcceptanceState {
  const { client } = useSupabase();
  const { authSession, bridge } = useAuthOperatorBridge();
  const { role } = useOperator();
  const { snapshot: envSnapshot } = useEnvironmentStatus();
  const historyRepository = useAgentExecutionHistoryRepository();
  const { publish } = useEventBus();
  const { auditLog } = useAudit();

  const [report, setReport] = useState<StagingPersistenceAcceptanceReport>(() =>
    StagingPersistenceAcceptanceSuite.buildInitialReport(envSnapshot.effectiveEnvironment),
  );
  const [running, setRunning] = useState(false);
  const [checkpoint, setCheckpoint] = useState<AcceptanceReloadCheckpoint | null>(() => {
    const state = loadAcceptanceContinuationState();
    return state
      ? {
          runId: state.token.suiteRunId,
          scenarioId: state.token.scenarioId,
          nextStepIndex: state.token.stepIndex,
          executionIds: state.token.executionIds,
          awaitingReload: state.token.status === "awaiting_reload",
          expiresAt: state.token.expiresAt,
          summary: "Checkpoint de reload ativo.",
        }
      : null;
  });

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

  const suiteInputBase = useMemo(
    () => ({
      environment: envSnapshot.effectiveEnvironment,
      configuredMode,
      health,
      role: role ?? "viewer",
      profileActive,
      isAuthenticated,
      operatorLabel: authSession.profile?.displayName ?? "operator",
      createdByUserId: authSession.user?.id ?? "",
      supabaseClient: client,
      listRecentExecutions: (limit?: number) =>
        persistence?.listRecentExecutions(limit) ?? Promise.resolve([]),
      listExecutionEvents: (executionId: string) =>
        persistence?.listExecutionEvents(executionId) ?? Promise.resolve([]),
      saveExecution: async (context: MissionExecutionContext) => {
        if (!persistence) {
          return { success: false, error: "Persistência indisponível." };
        }
        const writer = persistence as MissionExecutionPersistenceAdapterWithStatus & {
          saveExecution?: (
            context: MissionExecutionContext,
          ) => Promise<{ success: boolean; errorCode?: string; message?: string }>;
        };
        if (typeof writer.saveExecution === "function") {
          const result = await writer.saveExecution(context);
          return {
            success: result.success,
            error: result.success ? undefined : result.errorCode ?? result.message,
          };
        }
        writer.save(context);
        return { success: true };
      },
      historyEntries: [] as Awaited<
        ReturnType<NonNullable<typeof historyRepository>["listRecent"]>
      >,
    }),
    [
      authSession.profile?.displayName,
      authSession.profile?.id,
      authSession.user?.id,
      bridge.profileStatus,
      client,
      configuredMode,
      envSnapshot.effectiveEnvironment,
      health,
      isAuthenticated,
      persistence,
      profileActive,
      role,
    ],
  );

  const eligibility = useMemo(
    () => StagingPersistenceAcceptanceSuite.evaluateEligibility(suiteInputBase),
    [suiteInputBase],
  );

  const runSuite = useCallback(
    async (resumeExplicit: boolean) => {
      if (running || !persistence) return;

      setRunning(true);
      auditLog.record({
        actor: "mission-persistence",
        role: "system",
        source: "missions",
        action: "runtime_action_started",
        target: "staging-acceptance",
        severity: "info",
        message: resumeExplicit
          ? "Acceptance staging retomada após reload"
          : "Acceptance staging iniciada",
        metadata: { environment: envSnapshot.effectiveEnvironment, audited: true },
      });
      publish(
        "mission:persistence_acceptance_started",
        "missions",
        buildMissionPersistencePayload({
          executionId: "acceptance:staging",
          mode: configuredMode,
          adapter: health.activeAdapter,
          summary: resumeExplicit ? "Retomada após reload" : "Início acceptance",
          audited: true,
        }),
      );

      try {
        const diagnosticsHistory = historyRepository
          ? await historyRepository.listRecent("system-diagnostics-agent", 50, "combined")
          : [];
        const releaseHistory = historyRepository
          ? await historyRepository.listRecent("release-readiness-agent", 50, "combined")
          : [];

        const suite = new StagingPersistenceAcceptanceSuite();
        const { report: nextReport, checkpoint: nextCheckpoint } =
          await suite.runSafeAcceptance({
            ...suiteInputBase,
            historyEntries: [...diagnosticsHistory, ...releaseHistory],
            checkpoint,
            resumeExplicit,
          });

        setReport(nextReport);
        setCheckpoint(nextCheckpoint);

        const passed =
          nextReport.status === "passed" || nextReport.status === "passed_with_warnings";
        if (passed) {
          auditLog.record({
            actor: "mission-persistence",
            role: "system",
            source: "missions",
            action: "runtime_action_completed",
            target: "staging-acceptance",
            severity: "info",
            message: nextReport.summary.slice(0, 240),
            metadata: { passedCount: nextReport.passedCount, audited: true },
          });
          publish(
            "mission:persistence_acceptance_passed",
            "missions",
            buildMissionPersistencePayload({
              executionId: "acceptance:staging",
              mode: configuredMode,
              summary: nextReport.summary,
              audited: true,
            }),
          );
        } else if (nextReport.status !== "running") {
          auditLog.record({
            actor: "mission-persistence",
            role: "system",
            source: "missions",
            action: "runtime_action_failed",
            target: "staging-acceptance",
            severity: "warning",
            message: nextReport.summary.slice(0, 240),
            metadata: { status: nextReport.status, audited: true },
          });
          publish(
            "mission:persistence_acceptance_failed",
            "missions",
            buildMissionPersistencePayload({
              executionId: "acceptance:staging",
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
    },
    [
      auditLog,
      checkpoint,
      configuredMode,
      envSnapshot.effectiveEnvironment,
      health.activeAdapter,
      historyRepository,
      persistence,
      publish,
      running,
      suiteInputBase,
    ],
  );

  const startAcceptance = useCallback(async () => {
    await runSuite(false);
  }, [runSuite]);

  const resumeAfterReload = useCallback(async () => {
    await runSuite(true);
  }, [runSuite]);

  const resetAcceptance = useCallback(() => {
    clearAcceptanceContinuationState();
    setCheckpoint(null);
    setReport(
      StagingPersistenceAcceptanceSuite.buildInitialReport(
        envSnapshot.effectiveEnvironment,
      ),
    );
  }, [envSnapshot.effectiveEnvironment]);

  return {
    report,
    eligibility,
    checkpoint,
    running,
    startAcceptance,
    resumeAfterReload,
    resetAcceptance,
  };
}
