import type { MissionStatus } from "../MissionTypes";
import type { MissionExecutionStatus } from "./MissionExecutionTypes";

/** Mapeia status de execução para status do Mission Board (sem contradição). */
export function mapExecutionStatusToMissionStatus(
  executionStatus: MissionExecutionStatus,
): MissionStatus {
  switch (executionStatus) {
    case "created":
    case "validated":
    case "planned":
      return "planned";
    case "assigned":
    case "running":
      return "active";
    case "failed":
      return "blocked";
    case "completed":
      return "completed";
    case "cancelled":
      return "blocked";
    default:
      return "planned";
  }
}

export function isTerminalExecutionStatus(status: MissionExecutionStatus): boolean {
  return status === "completed" || status === "failed" || status === "cancelled";
}

export function isRunningExecutionStatus(status: MissionExecutionStatus): boolean {
  return status === "running" || status === "assigned";
}
