import type { MissionExecutionStatus } from "../../MissionExecutionTypes";
import {
  evaluateMissionExecutionRecovery,
  type MissionExecutionRecoveryDecision,
  type MissionExecutionRecoveryPolicyOptions,
} from "../MissionExecutionRecoveryPolicy";

export type MissionExecutionRecoveryDisplayStatus =
  | "interrupted"
  | "recovery_required"
  | "completed"
  | "failed"
  | "cancelled"
  | "running"
  | "assigned"
  | "created"
  | "other";

export interface MissionExecutionRecoveryPresentation {
  foundStatus: MissionExecutionStatus;
  displayStatus: MissionExecutionRecoveryDisplayStatus;
  decision: MissionExecutionRecoveryDecision;
  reason: string;
  recommendedAction: string;
  evaluatedAt: string;
  autoContinueAllowed: false;
}

const RECOVERY_RECOMMENDED_ACTIONS: Record<
  MissionExecutionRecoveryDisplayStatus,
  string
> = {
  interrupted:
    "Revisar execução interrompida manualmente — não continuar automaticamente nesta sprint.",
  recovery_required:
    "Aplicar recovery manual após validar estado persistido — agente não reinicia sozinho.",
  completed: "Nenhuma ação — execução terminal concluída.",
  failed: "Nenhuma ação automática — revisar falha e decidir retry manual.",
  cancelled: "Nenhuma ação — execução cancelada.",
  running: "Aguardar conclusão ou cancelar manualmente — não auto-continuar após reload.",
  assigned: "Confirmar atribuição ou cancelar — agente não inicia automaticamente após reload.",
  created: "Iniciar execução manualmente se desejado.",
  other: "Revisar estado manualmente.",
};

function resolveDisplayStatus(
  status: MissionExecutionStatus,
  decision: MissionExecutionRecoveryDecision,
): MissionExecutionRecoveryDisplayStatus {
  if (decision.nextStatus === "interrupted") return "interrupted";
  if (decision.nextStatus === "recovery_required") return "recovery_required";
  if (
    status === "completed" ||
    status === "failed" ||
    status === "cancelled" ||
    status === "running" ||
    status === "assigned" ||
    status === "created" ||
    status === "interrupted" ||
    status === "recovery_required"
  ) {
    return status;
  }
  return "other";
}

export function buildMissionExecutionRecoveryPresentation(
  status: MissionExecutionStatus,
  options?: MissionExecutionRecoveryPolicyOptions,
): MissionExecutionRecoveryPresentation {
  const decision = evaluateMissionExecutionRecovery(status, options);
  const displayStatus = resolveDisplayStatus(status, decision);

  return {
    foundStatus: status,
    displayStatus,
    decision,
    reason: decision.reason,
    recommendedAction: RECOVERY_RECOMMENDED_ACTIONS[displayStatus],
    evaluatedAt: new Date().toISOString(),
    autoContinueAllowed: false,
  };
}

export function formatMissionExecutionRecoveryPresentation(
  presentation: MissionExecutionRecoveryPresentation,
): string {
  return [
    `Estado encontrado: ${presentation.displayStatus}`,
    `Decisão: ${presentation.decision.action}`,
    `Motivo: ${presentation.reason}`,
    `Ação recomendada: ${presentation.recommendedAction}`,
    `Avaliado em: ${presentation.evaluatedAt}`,
  ].join(" · ");
}
