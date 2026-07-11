import type { MissionOperatorRole } from "./MissionExecutionTypes";
import {
  OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
} from "./MissionExecutionTypes";

export type MissionExecutionCapability = "view" | "execute" | "cancel" | "retry";

export interface MissionExecutionAccessInput {
  role: MissionOperatorRole;
  missionType: string;
  capability: MissionExecutionCapability;
}

/** RBAC de execução de missões — baseado em role, sem permissões novas no catálogo. */
export function canPerformMissionExecution(input: MissionExecutionAccessInput): boolean {
  const { role, missionType, capability } = input;

  if (capability === "view") {
    return true;
  }

  if (role === "viewer") {
    return false;
  }

  if (capability === "execute" || capability === "retry") {
    if (role === "operator") {
      return missionType === OPERATIONAL_DIAGNOSTIC_MISSION_TYPE;
    }
    return role === "owner" || role === "admin" || role === "operator";
  }

  if (capability === "cancel") {
    return role === "owner" || role === "admin";
  }

  return false;
}

export function missionExecutionAccessReason(input: MissionExecutionAccessInput): string {
  if (canPerformMissionExecution(input)) {
    return "Permitido";
  }

  if (input.role === "viewer") {
    return "Viewer pode apenas visualizar execuções";
  }

  if (input.capability === "cancel") {
    return "Cancelamento requer role owner ou admin";
  }

  if (input.role === "operator" && input.missionType !== OPERATIONAL_DIAGNOSTIC_MISSION_TYPE) {
    return "Operator pode executar apenas a missão diagnóstica operacional";
  }

  return "Permissão insuficiente para esta ação";
}
