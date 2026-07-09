"use client";

import { usePlatformBootstrap } from "@douglas/bootstrap";
import { createDependencyGraph } from "@douglas/graph";
import { useSystemHealth } from "@douglas/health";
import { useLiveEventMonitor } from "@douglas/monitor";
import {
  createPlatformStateFacade,
  PlatformStateProvider,
  type PlatformStateInput,
} from "@douglas/platform-state";
import { usePlatformRuntime } from "@douglas/runtime";
import { useDOS } from "@douglas/dos";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { buildLiveDependencyGraphInput } from "@/features/platform-graph/build-live-graph";
import type { PlatformHealthSources } from "@/features/platform-health/checks";
import { platformVersion } from "@/lib/mock-data";

interface PlatformStateIntegrationProps {
  children: ReactNode;
}

export function PlatformStateIntegration({ children }: PlatformStateIntegrationProps) {
  const bootstrap = usePlatformBootstrap();
  const runtime = usePlatformRuntime();
  const health = useSystemHealth();
  const monitor = useLiveEventMonitor();
  const dos = useDOS();

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

  const facade = useMemo(() => createPlatformStateFacade(), []);

  const snapshot = useMemo(() => {
    const input: PlatformStateInput = {
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
    };

    return facade.build(input);
  }, [
    bootstrap.isBooting,
    bootstrap.isReady,
    bootstrap.state,
    dependencyGraphReport,
    dos.isReady,
    dos.state,
    facade,
    health.isEvaluating,
    health.report,
    monitor.snapshot.events,
    monitor.snapshot.lastEventAt,
    monitor.snapshot.totalCount,
    runtime.isRunning,
    runtime.isStarting,
    runtime.state,
  ]);

  return (
    <PlatformStateProvider snapshot={snapshot} facade={facade}>
      {children}
    </PlatformStateProvider>
  );
}
