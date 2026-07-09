import { buildOperationalActionAvailability } from "./OperationalActionAvailability";
import { buildOperationalRecommendations } from "./OperationalRecommendation";
import { buildOperationalStatus } from "./OperationalStatus";
import type {
  CommandCenterEventInput,
  CommandCenterRuntimeActionInput,
  OperationalCommandCenterInput,
  OperationalCommandCenterSnapshot,
  OperationalCriticalEvent,
  OperationalRecentAction,
} from "./OperationalCommandCenterTypes";

function mapRecentActions(
  actions: CommandCenterRuntimeActionInput[],
): OperationalRecentAction[] {
  return actions.slice(0, 5).map((action) => ({
    commandId: action.commandId,
    moduleId: action.moduleId,
    action: action.action,
    actionLabel: action.actionLabel,
    success: action.success,
    message: action.message,
    completedAt: action.completedAt,
    durationMs: action.durationMs,
  }));
}

function mapCriticalEvents(
  events: CommandCenterEventInput[],
): OperationalCriticalEvent[] {
  return events.slice(0, 5).map((event) => ({
    id: event.id,
    message: event.message,
    source: event.source,
    severity: event.severity,
    timestamp: event.timestamp,
  }));
}

export class OperationalCommandCenter {
  build(input: OperationalCommandCenterInput): OperationalCommandCenterSnapshot {
    const status = buildOperationalStatus(input.platform, input.diagnostics);
    const recommendations = buildOperationalRecommendations(
      input.platform,
      input.diagnostics,
    );
    const actionAvailability = buildOperationalActionAvailability(
      input.runtimeModules,
      input.diagnostics,
    );

    return {
      status,
      recommendations,
      recentActions: mapRecentActions(input.recentActions),
      recentCriticalEvents: mapCriticalEvents(input.criticalEvents),
      actionAvailability,
    };
  }
}

export function createOperationalCommandCenter(): OperationalCommandCenter {
  return new OperationalCommandCenter();
}
