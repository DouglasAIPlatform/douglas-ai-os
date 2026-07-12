import type { MissionOperatorRole } from "./MissionExecutionTypes";
import {
  PERSISTABLE_MISSION_TYPES,
  type PersistableMissionType,
} from "./MissionExecutionTypes";

/** Mission types que operator pode executar e persistir — derivado do catálogo canônico. */
export function getOperatorExecutableMissionTypes(): readonly PersistableMissionType[] {
  return PERSISTABLE_MISSION_TYPES;
}

export function hasMissionExecutionAccessPolicy(missionType: string): boolean {
  return (PERSISTABLE_MISSION_TYPES as readonly string[]).includes(missionType);
}

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
      return (PERSISTABLE_MISSION_TYPES as readonly string[]).includes(missionType);
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

  if (
    input.role === "operator" &&
    !(PERSISTABLE_MISSION_TYPES as readonly string[]).includes(input.missionType)
  ) {
    return "Operator pode executar apenas missões operacionais registradas";
  }

  return "Permissão insuficiente para esta ação";
}
