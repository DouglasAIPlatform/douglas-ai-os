"use client";

import { usePlatformBootstrap } from "@douglas/bootstrap";
import { DiagnosticsProvider, type DiagnosticsInput, type DiagnosticsReportEventPayload, type ReadinessReport } from "@douglas/diagnostics";
import { useDOS } from "@douglas/dos";
import type { EventTopic } from "@douglas/events";
import { useEventBus } from "@douglas/events";
import { createDependencyGraph } from "@douglas/graph";
import { useSystemHealth } from "@douglas/health";
import { useLiveEventMonitor } from "@douglas/monitor";
import {
  createPlatformStateFacade,
  PlatformStateProvider,
  type PlatformStateInput,
} from "@douglas/platform-state";
import { usePlatformRuntime } from "@douglas/runtime";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { buildLiveDependencyGraphInput } from "@/features/platform-graph/build-live-graph";
import type { PlatformHealthSources } from "@/features/platform-health/checks";
import { platformVersion } from "@/lib/mock-data";

interface PlatformOperationalIntegrationProps {
  children: ReactNode;
}

export function PlatformOperationalIntegration({
  children,
}: PlatformOperationalIntegrationProps) {
  const bootstrap = usePlatformBootstrap();
  const runtime = usePlatformRuntime();
  const health = useSystemHealth();
  const monitor = useLiveEventMonitor();
  const dos = useDOS();
  const { publish } = useEventBus();
  const [diagnosticsReport, setDiagnosticsReport] = useState<ReadinessReport | null>(null);

  const facade = useMemo(() => createPlatformStateFacade(), []);

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

  const basePlatformInput: PlatformStateInput = useMemo(
    () => ({
      platformVersion,
      bootstrap: {
        status: bootstrap.state.status,
        health: bootstrap.state.health,
        readyModuleCount: bootstrap.state.readyModuleCount,
        totalModuleCount: bootstrap.state.totalModuleCount,
        isReady: bootstrap.isReady,
        isBooting: bootstrap.isBooting,
        modules: bootstrap.state.modules.map((module) => ({
          id: module.id,
          name: module.name,
          version: module.version,
          status: module.status,
          health: module.health,
          message: module.message,
        })),
      },
      runtime: {
        status: runtime.state.status,
        health: runtime.state.health,
        readyModuleCount: runtime.state.readyModuleCount,
        totalModuleCount: runtime.state.totalModuleCount,
        isRunning: runtime.isRunning,
        isStarting: runtime.isStarting,
        modules: runtime.state.modules.map((module) => ({
          id: module.id,
          name: module.name,
          version: module.version,
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
            isEvaluating: health.isEvaluating,
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
            healthyEdgeCount: dependencyGraphReport.healthyEdgeCount,
            warningEdgeCount: dependencyGraphReport.warningEdgeCount,
            criticalEdgeCount: dependencyGraphReport.criticalEdgeCount,
            issueCount: dependencyGraphReport.issues.length,
          }
        : null,
      eventMonitor: {
        totalCount: monitor.snapshot.totalCount,
        lastEventAt: monitor.snapshot.lastEventAt,
        isMonitoring: monitor.snapshot.totalCount > 0 || Boolean(monitor.snapshot.lastEventAt),
        hasCriticalRecent: monitor.snapshot.events.some(
          (event) => event.severity === "critical" || event.severity === "error",
        ),
      },
      dos: {
        status: dos.state.status,
        health: dos.state.health,
        runtimePhase: dos.state.runtimePhase,
        readyModuleCount: dos.state.readyModuleCount,
        moduleCount: dos.state.moduleCount,
        isReady: dos.isReady,
      },
      diagnosticsReadiness: null,
    }),
    [
      bootstrap.isBooting,
      bootstrap.isReady,
      bootstrap.state,
      dependencyGraphReport,
      dos.isReady,
      dos.state,
      health.isEvaluating,
      health.report,
      monitor.snapshot.events,
      monitor.snapshot.lastEventAt,
      monitor.snapshot.totalCount,
      runtime.isRunning,
      runtime.isStarting,
      runtime.state,
    ],
  );

  const fallbackBlockers = useMemo(() => {
    return facade.build(basePlatformInput).readiness.blockers;
  }, [basePlatformInput, facade]);

  const diagnosticsInput: DiagnosticsInput = useMemo(
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
        events: monitor.snapshot.events
          .filter((event) => !event.demo)
          .map((event) => ({
          id: event.id,
          source: String(event.source),
          type: event.type,
          severity: event.severity,
          message: event.message,
          timestamp: event.timestamp,
        })),
      },
      platform: {
        readinessScore: 0,
        readinessLevel: "partial",
        blockers: fallbackBlockers,
      },
    }),
    [
      bootstrap.isBooting,
      bootstrap.isReady,
      bootstrap.state,
      dependencyGraphReport,
      fallbackBlockers,
      health.report,
      monitor.snapshot.events,
      runtime.isRunning,
      runtime.isStarting,
      runtime.state,
    ],
  );

  const snapshot = useMemo(() => {
    const input: PlatformStateInput = {
      ...basePlatformInput,
      diagnosticsReadiness: diagnosticsReport
        ? {
            score: diagnosticsReport.score,
            status: diagnosticsReport.status,
            ready: diagnosticsReport.ready,
            generatedAt: diagnosticsReport.generatedAt,
          }
        : null,
    };

    return facade.build(input);
  }, [basePlatformInput, diagnosticsReport, facade]);

  const handleReportChange = useCallback((report: ReadinessReport | null) => {
    setDiagnosticsReport(report);
  }, []);

  return (
    <PlatformStateProvider snapshot={snapshot} facade={facade}>
      <DiagnosticsProvider
        input={diagnosticsInput}
        enabled={bootstrap.isReady}
        publish={publishDiagnosticEvent}
        onReportChange={handleReportChange}
      >
        {children}
      </DiagnosticsProvider>
    </PlatformStateProvider>
  );
}
