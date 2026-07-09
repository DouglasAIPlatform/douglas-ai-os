"use client";

import { useBootDiagnostics } from "@douglas/diagnostics";
import {
  createOperationalCommandCenter,
  type OperationalActionType,
  type OperationalCommandCenterSnapshot,
} from "@douglas/command-center";
import { useSystemHealth } from "@douglas/health";
import { useLiveEventMonitor } from "@douglas/monitor";
import { usePlatformState } from "@douglas/platform-state";
import {
  RUNTIME_ACTION_LABELS,
  useRuntimeControl,
  type RuntimeActionType,
} from "@douglas/runtime";
import { useMemo } from "react";

const commandCenter = createOperationalCommandCenter();

export function useOperationalCommandCenter(): OperationalCommandCenterSnapshot {
  const { snapshot } = usePlatformState();
  const { report: diagnosticsReport } = useBootDiagnostics();
  const { service, modules, panel } = useRuntimeControl();
  const health = useSystemHealth();
  const monitor = useLiveEventMonitor();

  return useMemo(
    () =>
      commandCenter.build({
        platform: {
          overallStatus: snapshot.summary.overall,
          readinessScore: snapshot.readiness.score,
          readinessLevel: snapshot.readiness.level,
          platformReady: snapshot.readiness.readyForOperations,
          readyModules: snapshot.summary.readyModules,
          alertModules: snapshot.summary.alertModules,
          criticalModules: snapshot.summary.criticalModules,
          offlineModules: snapshot.summary.offlineModules,
          loadedModules: snapshot.summary.loadedModules,
          blockers: snapshot.readiness.blockers,
          healthStatus: health.report?.status,
          generatedAt: snapshot.generatedAt,
        },
        diagnostics: diagnosticsReport
          ? {
              ready: diagnosticsReport.ready,
              score: diagnosticsReport.score,
              status: diagnosticsReport.status,
              generatedAt: diagnosticsReport.generatedAt,
              criticalIssueCount: diagnosticsReport.criticalIssues.length,
              warningCount: diagnosticsReport.warnings.length,
              recommendations: diagnosticsReport.recommendations.map((rec) => ({
                id: rec.id,
                priority: rec.priority,
                message: rec.message,
              })),
            }
          : null,
        runtimeModules: modules.map((module) => ({
          id: module.id,
          name: module.name,
          status: module.status,
          actions: service.getAvailableActions(module).map((action) => ({
            type: action.type as OperationalActionType,
            enabled: action.enabled,
            reason: action.reason,
          })),
        })),
        recentActions: panel.getHistory(5).map((result) => ({
          commandId: result.commandId,
          moduleId: result.moduleId,
          action: result.action as OperationalActionType,
          actionLabel: RUNTIME_ACTION_LABELS[result.action],
          success: result.success,
          message: result.message,
          completedAt: result.completedAt,
          durationMs: result.durationMs,
        })),
        criticalEvents: monitor.snapshot.events
          .filter(
            (event) => event.severity === "critical" || event.severity === "error",
          )
          .slice(0, 5)
          .map((event) => ({
            id: event.id,
            message: event.message,
            source: String(event.source),
            severity: event.severity,
            timestamp: event.timestamp,
          })),
      }),
    [
      diagnosticsReport,
      health.report?.status,
      modules,
      monitor.snapshot.events,
      panel,
      service,
      snapshot.generatedAt,
      snapshot.readiness.blockers,
      snapshot.readiness.level,
      snapshot.readiness.readyForOperations,
      snapshot.readiness.score,
      snapshot.summary.alertModules,
      snapshot.summary.criticalModules,
      snapshot.summary.loadedModules,
      snapshot.summary.offlineModules,
      snapshot.summary.overall,
      snapshot.summary.readyModules,
    ],
  );
}

export function findOperationalAction(
  commandSnapshot: OperationalCommandCenterSnapshot,
  moduleId: string,
  action: RuntimeActionType,
) {
  return commandSnapshot.actionAvailability.find(
    (entry) => entry.moduleId === moduleId && entry.action === action,
  );
}
