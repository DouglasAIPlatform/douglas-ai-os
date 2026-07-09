import type {
  CommandCenterDiagnosticsInput,
  CommandCenterRuntimeModuleInput,
  OperationalActionAvailability,
  OperationalActionType,
} from "./OperationalCommandCenterTypes";
import { OPERATIONAL_ACTION_LABELS } from "./OperationalCommandCenterTypes";

const DESTRUCTIVE_ACTIONS: OperationalActionType[] = [
  "pause_module",
  "resume_module",
  "restart_module",
];

const ALL_ACTIONS: OperationalActionType[] = [
  "refresh_module",
  "run_health_check",
  ...DESTRUCTIVE_ACTIONS,
];

export function resolveOperationalActionAvailability(
  module: CommandCenterRuntimeModuleInput,
  action: OperationalActionType,
  diagnostics: CommandCenterDiagnosticsInput | null,
): OperationalActionAvailability {
  const runtimeAction = module.actions.find((entry) => entry.type === action);
  const baseAvailable = runtimeAction?.enabled ?? false;
  const baseReason = runtimeAction?.reason;

  if (!DESTRUCTIVE_ACTIONS.includes(action)) {
    return {
      moduleId: module.id,
      moduleName: module.name,
      action,
      label: OPERATIONAL_ACTION_LABELS[action],
      available: baseAvailable,
      requiresConfirmation: false,
      blockedByReadiness: false,
      reason: baseAvailable ? undefined : baseReason,
    };
  }

  if (!diagnostics) {
    return {
      moduleId: module.id,
      moduleName: module.name,
      action,
      label: OPERATIONAL_ACTION_LABELS[action],
      available: baseAvailable,
      requiresConfirmation: baseAvailable,
      blockedByReadiness: false,
      reason: baseAvailable
        ? "Diagnóstico pendente — confirmação necessária"
        : baseReason,
    };
  }

  if (!diagnostics.ready) {
    if (diagnostics.status === "not_ready") {
      return {
        moduleId: module.id,
        moduleName: module.name,
        action,
        label: OPERATIONAL_ACTION_LABELS[action],
        available: false,
        requiresConfirmation: false,
        blockedByReadiness: true,
        reason: "Plataforma não pronta — resolva problemas críticos antes de agir",
      };
    }

    return {
      moduleId: module.id,
      moduleName: module.name,
      action,
      label: OPERATIONAL_ACTION_LABELS[action],
      available: baseAvailable,
      requiresConfirmation: baseAvailable,
      blockedByReadiness: false,
      reason: baseAvailable
        ? "Plataforma degradada — confirmação necessária"
        : baseReason,
    };
  }

  return {
    moduleId: module.id,
    moduleName: module.name,
    action,
    label: OPERATIONAL_ACTION_LABELS[action],
    available: baseAvailable,
    requiresConfirmation: false,
    blockedByReadiness: false,
    reason: baseAvailable ? undefined : baseReason,
  };
}

export function buildOperationalActionAvailability(
  modules: CommandCenterRuntimeModuleInput[],
  diagnostics: CommandCenterDiagnosticsInput | null,
): OperationalActionAvailability[] {
  return modules.flatMap((module) =>
    ALL_ACTIONS.map((action) =>
      resolveOperationalActionAvailability(module, action, diagnostics),
    ),
  );
}

export function findActionAvailability(
  availability: OperationalActionAvailability[],
  moduleId: string,
  action: OperationalActionType,
): OperationalActionAvailability | undefined {
  return availability.find(
    (entry) => entry.moduleId === moduleId && entry.action === action,
  );
}
