"use client";

import type { OperationalAgentRuntime, ReleaseReadinessSnapshotSource } from "@douglas/agents";
import {
  RELEASE_READINESS_AGENT_ID,
  SYSTEM_DIAGNOSTICS_AGENT_ID,
} from "@douglas/agents";
import { useAudit } from "@douglas/audit";
import { resolveCanonicalEnvironment } from "@douglas/environment";
import { useMemo } from "react";
import { useStagingReadiness } from "@/features/platform-environment/useStagingReadiness";
import { useReleaseStatus } from "@/features/platform-release/useReleaseStatus";
import { useProductionSafetyGate } from "@/features/platform-supabase/production-safety/useProductionSafetyGate";
import { useMissionExecutionPersistenceAdapter } from "./MissionExecutionPersistenceContext";
import { buildReleaseReadinessSnapshotFromPlatform } from "./buildReleaseReadinessSnapshot";
import {
  isMissionExecutionPersistenceWithStatus,
  readMissionExecutionPersistenceStatus,
} from "@douglas/missions";

export function useReleaseReadinessSnapshotSource(
  agentRuntime: OperationalAgentRuntime,
): ReleaseReadinessSnapshotSource {
  const releaseStatus = useReleaseStatus();
  const staging = useStagingReadiness();
  const productionSafety = useProductionSafetyGate();
  const { ingestObservability } = useAudit();
  const persistence = useMissionExecutionPersistenceAdapter();

  const environmentResolution = useMemo(() => resolveCanonicalEnvironment(), []);

  const persistenceHealth = useMemo(() => {
    const adapter = persistence ?? undefined;
    return isMissionExecutionPersistenceWithStatus(adapter)
      ? adapter.getStatus()
      : readMissionExecutionPersistenceStatus(adapter);
  }, [persistence]);

  return useMemo(
    () => ({
      collect: () =>
        buildReleaseReadinessSnapshotFromPlatform({
          release: {
            version: releaseStatus.snapshot.version,
            channel: releaseStatus.snapshot.channel,
            releaseStatus: releaseStatus.snapshot.releaseStatus,
            environment: releaseStatus.snapshot.environment,
            environmentLabel: releaseStatus.snapshot.environmentLabel,
            versionConsistent: releaseStatus.snapshot.versionConsistent,
            staticReadinessValid: releaseStatus.snapshot.staticReadinessValid,
            runtimeReadinessHint: releaseStatus.snapshot.runtimeReadinessHint,
            alerts: releaseStatus.snapshot.alerts,
          },
          staging: {
            status: staging.report.status,
            bootstrapStatus: staging.report.bootstrapStatus,
            effectiveEnvironment: staging.report.snapshot.effectiveEnvironment,
            blockingCount: staging.blockingCount,
            pendingRuntimeCount: staging.pendingRuntimeCount,
            passedCount: staging.passedCount,
            blockers: staging.report.blockers,
            alerts: staging.report.alerts,
          },
          productionSafety: productionSafety.report
            ? {
                status: productionSafety.report.status,
                environment: productionSafety.report.environment,
                blockingCount: productionSafety.report.blockingChecks.length,
                alertCount: productionSafety.report.alertChecks.length,
                suggestedNextSteps: productionSafety.report.suggestedNextSteps,
              }
            : null,
          environment: {
            canonical: environmentResolution.canonical,
            releaseChannel: environmentResolution.releaseChannel,
            effectiveEnvironment: environmentResolution.effectiveEnvironment,
            declaredExplicitly: environmentResolution.declaredExplicitly,
            hasCriticalMismatch: environmentResolution.hasCriticalMismatch,
            warnings: environmentResolution.warnings,
          },
          auditIngest: {
            totalAttempts: ingestObservability.totalAttempts,
            accepted: ingestObservability.accepted,
            rejected: ingestObservability.rejected,
            failed: ingestObservability.failed,
            lastOutcome: ingestObservability.lastOutcome,
            lastError: ingestObservability.lastError,
          },
          missionPersistence: {
            mode: persistenceHealth.mode,
            activeAdapter: persistenceHealth.activeAdapter,
            fallbackActive: persistenceHealth.fallbackActive,
            pendingSyncCount: persistenceHealth.pendingSyncCount,
            supabaseConfigured: persistenceHealth.supabaseConfigured,
            lastError: persistenceHealth.lastError,
          },
          agentMetrics: [SYSTEM_DIAGNOSTICS_AGENT_ID, RELEASE_READINESS_AGENT_ID].map(
            (agentId) => {
              const session = agentRuntime.getMetrics(agentId);
              const total = session.executions;
              const successRate =
                total > 0 ? Math.round((session.completed / total) * 100) / 100 : null;
              return {
                agentId,
                totalExecutions: total,
                completed: session.completed,
                failed: session.failed,
                successRate,
                insufficientSample: total === 0,
                dataSource: "session",
              };
            },
          ),
        }),
    }),
    [
      agentRuntime,
      environmentResolution,
      ingestObservability,
      persistenceHealth,
      productionSafety.report,
      releaseStatus.snapshot,
      staging.blockingCount,
      staging.passedCount,
      staging.pendingRuntimeCount,
      staging.report,
    ],
  );
}
