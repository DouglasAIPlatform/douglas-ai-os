import type { MissionExecutionStatus } from "../MissionExecutionTypes";
import { isRunningExecutionStatus } from "../MissionExecutionStatusMapper";

export type MissionExecutionRecoveryAction =
  | "none"
  | "mark_interrupted"
  | "mark_recovery_required";

export interface MissionExecutionRecoveryDecision {
  action: MissionExecutionRecoveryAction;
  nextStatus?: MissionExecutionStatus;
  reason: string;
  shouldEmitRecoveryRequired: boolean;
}

export interface MissionExecutionRecoveryPolicyOptions {
  /** Após reload, running/assigned vira interrupted (default) ou recovery_required. */
  staleRunningStatus?: "interrupted" | "recovery_required";
}

const DEFAULT_OPTIONS: MissionExecutionRecoveryPolicyOptions = {
  staleRunningStatus: "interrupted",
};

/**
 * Execuções running/assigned encontradas após reload não reiniciam agente —
 * apenas marcam estado de recuperação.
 */
export function evaluateMissionExecutionRecovery(
  status: MissionExecutionStatus,
  options: MissionExecutionRecoveryPolicyOptions = DEFAULT_OPTIONS,
): MissionExecutionRecoveryDecision {
  const resolved = { ...DEFAULT_OPTIONS, ...options };

  if (!isRunningExecutionStatus(status)) {
    return {
      action: "none",
      reason: "Execução não está em estado volátil",
      shouldEmitRecoveryRequired: false,
    };
  }

  const nextStatus =
    resolved.staleRunningStatus === "recovery_required"
      ? "recovery_required"
      : "interrupted";

  return {
    action:
      nextStatus === "recovery_required" ? "mark_recovery_required" : "mark_interrupted",
    nextStatus,
    reason:
      "Execução encontrada em andamento após reload — agente não reinicia automaticamente",
    shouldEmitRecoveryRequired: nextStatus === "recovery_required",
  };
}
