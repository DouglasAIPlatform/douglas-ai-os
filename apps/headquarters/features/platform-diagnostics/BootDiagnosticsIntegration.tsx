"use client";

import { usePlatformBootstrap } from "@douglas/bootstrap";
import { DiagnosticsProvider, type DiagnosticsInput, type DiagnosticsReportEventPayload } from "@douglas/diagnostics";
import type { EventTopic } from "@douglas/events";
import { useEventBus } from "@douglas/events";
import { createDependencyGraph } from "@douglas/graph";
import { useSystemHealth } from "@douglas/health";
import { useLiveEventMonitor } from "@douglas/monitor";
import { usePlatformState } from "@douglas/platform-state";
import { usePlatformRuntime } from "@douglas/runtime";
import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import { buildLiveDependencyGraphInput } from "@/features/platform-graph/build-live-graph";
import type { PlatformHealthSources } from "@/features/platform-health/checks";
import { platformVersion } from "@/lib/mock-data";

interface BootDiagnosticsIntegrationProps {
  children: ReactNode;
}

export function BootDiagnosticsIntegration({ children }: BootDiagnosticsIntegrationProps) {
  const bootstrap = usePlatformBootstrap();
  const runtime = usePlatformRuntime();
  const health = useSystemHealth();
  const monitor = useLiveEventMonitor();
  const { snapshot } = usePlatformState();
  const { publish } = useEventBus();

  const publishDiagnosticEvent = useCallback(
    (topic: string, payload: DiagnosticsReportEventPayload) => {
      publish(topic as EventTopic, "core", payload);
    },
    [publish],
  );

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

  const input: DiagnosticsInput = useMemo(
    () => ({
      platformVersion,
      bootstrap: {
        status: bootstrap.state.status,
        isReady: bootstrap.isReady,
        isBooting: bootstrap.isBooting,
        bootDurationMs: bootstrap.state.bootDurationMs,
        bootStartedAt: bootstrap.state.bootStartedAt,
        bootCompletedAt: bootstrap.state.bootCompletedAt,
        readyModuleCount: bootstrap.state.readyModuleCount,
        totalModuleCount: bootstrap.state.totalModuleCount,
        modules: bootstrap.state.modules.map((module) => ({
          id: module.id,
          name: module.name,
          status: module.status,
          health: module.health,
          initTimeMs: module.initTimeMs,
          loadedAt: module.loadedAt,
          message: module.message,
        })),
      },
      runtime: {
        status: runtime.state.status,
        isRunning: runtime.isRunning,
        isStarting: runtime.isStarting,
        readyModuleCount: runtime.state.readyModuleCount,
        totalModuleCount: runtime.state.totalModuleCount,
        uptimeMs: runtime.state.uptimeMs,
        modules: runtime.state.modules.map((module) => ({
          id: module.id,
          name: module.name,
          status: module.status,
          health: module.health,
          message: module.message,
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
      eventMonitor: {
        events: monitor.snapshot.events.map((event) => ({
          id: event.id,
          source: String(event.source),
          type: event.type,
          severity: event.severity,
          message: event.message,
          timestamp: event.timestamp,
        })),
      },
      platform: {
        readinessScore: snapshot.readiness.score,
        readinessLevel: snapshot.readiness.level,
        blockers: snapshot.readiness.blockers,
      },
    }),
    [
      bootstrap.isBooting,
      bootstrap.isReady,
      bootstrap.state,
      dependencyGraphReport,
      health.report,
      monitor.snapshot.events,
      runtime.isRunning,
      runtime.isStarting,
      runtime.state,
      snapshot.readiness.blockers,
      snapshot.readiness.level,
      snapshot.readiness.score,
    ],
  );

  return (
    <DiagnosticsProvider
      input={input}
      enabled={bootstrap.isReady}
      publish={publishDiagnosticEvent}
    >
      {children}
    </DiagnosticsProvider>
  );
}
