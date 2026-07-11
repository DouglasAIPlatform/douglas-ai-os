"use client";

import type { OperationalSnapshotSource } from "@douglas/agents";
import { usePlatformBootstrap } from "@douglas/bootstrap";
import { createDependencyGraph } from "@douglas/graph";
import { useSystemHealth } from "@douglas/health";
import { useLiveEventMonitor } from "@douglas/monitor";
import { usePlatformState } from "@douglas/platform-state";
import { usePlatformRuntime } from "@douglas/runtime";
import { useMemo } from "react";
import { useAudit } from "@douglas/audit";
import { useEnvironmentStatus } from "@/features/platform-environment/useEnvironmentStatus";
import { buildLiveDependencyGraphInput } from "@/features/platform-graph/build-live-graph";
import type { PlatformHealthSources } from "@/features/platform-health/checks";
import { useProductionSafetyGate } from "@/features/platform-supabase/production-safety/useProductionSafetyGate";
import { useReleaseStatus } from "@/features/platform-release/useReleaseStatus";
import { buildOperationalSnapshotFromPlatform } from "./buildOperationalSnapshot";

export function useOperationalSnapshotSource(): OperationalSnapshotSource {
  const bootstrap = usePlatformBootstrap();
  const runtime = usePlatformRuntime();
  const health = useSystemHealth();
  const monitor = useLiveEventMonitor();
  const { snapshot: platformSnapshot } = usePlatformState();
  const { entries: auditEntries, totalCount: auditTotal } = useAudit();
  const { snapshot: environmentSnapshot } = useEnvironmentStatus();
  const releaseStatus = useReleaseStatus();
  const productionSafety = useProductionSafetyGate();

  const healthSources: PlatformHealthSources = useMemo(
    () => ({
      bootstrapReady: bootstrap.isReady,
      runtimeRunning: runtime.isRunning,
      platformUptimeMs: runtime.state.uptimeMs,
      findBootstrapModule: (id) =>
        bootstrap.state.modules.find((module) => module.id === id),
      findRuntimeModule: (id) =>
        runtime.state.modules.find((module) => module.id === id),
    }),
    [
      bootstrap.isReady,
      bootstrap.state.modules,
      runtime.isRunning,
      runtime.state.modules,
      runtime.state.uptimeMs,
    ],
  );

  const dependencyGraphReport = useMemo(() => {
    const input = buildLiveDependencyGraphInput(healthSources);
    return createDependencyGraph(input).getReport();
  }, [healthSources]);

  return useMemo(
    () => ({
      collect: () =>
        buildOperationalSnapshotFromPlatform({
          runtime: {
            status: runtime.state.status,
            isRunning: runtime.isRunning,
            uptimeMs: runtime.state.uptimeMs,
            readyModuleCount: runtime.state.readyModuleCount,
            totalModuleCount: runtime.state.totalModuleCount,
            modules: runtime.state.modules.map((module) => ({
              id: module.id,
              name: module.name,
              status: module.status,
              health: module.health,
            })),
          },
          health: health.report
            ? {
                status: health.report.status,
                healthyCount: health.report.healthyCount,
                warningCount: health.report.warningCount,
                criticalCount: health.report.criticalCount,
                offlineCount: health.report.offlineCount,
                modules: health.report.modules.map((module) => ({
                  moduleId: module.moduleId,
                  moduleName: module.moduleName,
                  status: module.status,
                  message: module.message,
                })),
              }
            : null,
          dependencyGraph: dependencyGraphReport
            ? {
                status: dependencyGraphReport.status,
                issueCount: dependencyGraphReport.issues.length,
                circularDependencyCount: dependencyGraphReport.circularDependencyCount,
                criticalUnavailableCount: dependencyGraphReport.criticalUnavailableCount,
                issues: dependencyGraphReport.issues.map((issue) => ({
                  type: issue.type,
                  message: issue.message,
                  severity: issue.severity,
                  moduleId: issue.moduleId,
                })),
              }
            : null,
          events: {
            totalCount: monitor.snapshot.totalCount,
            events: monitor.snapshot.events.slice(0, 10).map((event) => ({
              id: event.id,
              source: String(event.source),
              type: event.type,
              severity: event.severity,
              message: event.message,
              timestamp: event.timestamp,
            })),
          },
          audit: {
            totalEntries: auditTotal,
            recentSummary:
              auditEntries[0]?.message?.slice(0, 120) ?? "Sem entradas recentes de audit",
            ingestOutcome: "accepted",
          },
          environment: {
            environment: environmentSnapshot.environment,
            profile: environmentSnapshot.effectiveEnvironment,
            allowMocks: environmentSnapshot.mocksAllowed,
          },
          release: {
            version: releaseStatus.snapshot.version,
            readinessStatus: releaseStatus.snapshot.releaseStatus,
          },
          productionSafety: productionSafety.report
            ? {
                gateStatus: productionSafety.report.status,
                blocked: productionSafety.report.blockingChecks.length > 0,
                summary:
                  productionSafety.report.suggestedNextSteps[0] ??
                  `Gate ${productionSafety.report.status}`,
              }
            : null,
          readinessScore: platformSnapshot.readiness.score,
          readinessLevel: platformSnapshot.readiness.level,
        }),
    }),
    [
      auditEntries,
      auditTotal,
      dependencyGraphReport,
      environmentSnapshot.effectiveEnvironment,
      environmentSnapshot.environment,
      environmentSnapshot.mocksAllowed,
      health.report,
      monitor.snapshot.events,
      monitor.snapshot.totalCount,
      platformSnapshot.readiness.level,
      platformSnapshot.readiness.score,
      productionSafety.report,
      releaseStatus.snapshot.releaseStatus,
      releaseStatus.snapshot.version,
      runtime.isRunning,
      runtime.state,
    ],
  );
}
