import {
  OPERATIONAL_DIAGNOSTIC_AGENT_ID,
  OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
  RELEASE_READINESS_AGENT_ID,
  RELEASE_READINESS_REVIEW_MISSION_TYPE,
} from "../../MissionExecutionTypes";
import type {
  StagingPersistenceAcceptanceScenario,
  StagingPersistenceAcceptanceScenarioId,
  StagingPersistenceAcceptanceStep,
} from "./StagingPersistenceAcceptanceTypes";

function pendingSteps(
  steps: Array<{ id: string; label: string }>,
): StagingPersistenceAcceptanceStep[] {
  return steps.map((step) => ({
    id: step.id,
    label: step.label,
    status: "pending",
    message: "Aguardando execução.",
  }));
}

export const STAGING_PERSISTENCE_ACCEPTANCE_SCENARIO_DEFS: Array<
  Pick<
    StagingPersistenceAcceptanceScenario,
    "id" | "label" | "description" | "missionType" | "agentId"
  > & { stepDefs: Array<{ id: string; label: string }> }
> = [
  {
    id: "system_diagnostics",
    label: "System Diagnostics",
    description:
      "Executar operational_diagnostic, persistir timeline, recarregar e confirmar histórico/métricas sem reexecutar agente.",
    missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
    agentId: OPERATIONAL_DIAGNOSTIC_AGENT_ID,
    stepDefs: [
      { id: "execute_mission", label: "Executar operational_diagnostic" },
      { id: "assign_agent", label: "Atribuir system-diagnostics-agent" },
      { id: "persist_execution", label: "Persistir execução e timeline" },
      { id: "complete_mission", label: "Concluir execução" },
      { id: "register_report", label: "Registrar relatório" },
      { id: "reload_simulation", label: "Simular reload / reidratação" },
      { id: "confirm_completed", label: "Confirmar execução concluída" },
      { id: "no_agent_rerun", label: "Agente não reexecutado" },
      { id: "history_metrics", label: "Histórico e métricas validados" },
    ],
  },
  {
    id: "release_readiness",
    label: "Release Readiness",
    description:
      "Executar release_readiness_review, persistir verdict, recarregar e confirmar blockers/warnings sem aprovação de produção.",
    missionType: RELEASE_READINESS_REVIEW_MISSION_TYPE,
    agentId: RELEASE_READINESS_AGENT_ID,
    stepDefs: [
      { id: "execute_mission", label: "Executar release_readiness_review" },
      { id: "assign_agent", label: "Atribuir release-readiness-agent" },
      { id: "persist_verdict", label: "Persistir verdict" },
      { id: "reload_simulation", label: "Simular reload / reidratação" },
      { id: "confirm_verdict", label: "Confirmar blockers/warnings/evidence" },
      { id: "agent_history", label: "Histórico do agente correto" },
      { id: "no_production_approval", label: "Aprovação de produção não executada" },
    ],
  },
  {
    id: "recovery",
    label: "Recovery",
    description:
      "Execução running/assigned após reload vira interrupted/recovery_required sem reiniciar agente automaticamente.",
    stepDefs: [
      { id: "load_running", label: "Carregar execução running/assigned persistida" },
      { id: "no_auto_restart", label: "Agente não reinicia automaticamente" },
      { id: "apply_policy", label: "Aplicar MissionExecutionRecoveryPolicy" },
      { id: "mark_interrupted", label: "Marcar interrupted ou recovery_required" },
      { id: "audit_once", label: "Audit exactly-once" },
      { id: "manual_action", label: "Ação manual segura documentada" },
    ],
  },
  {
    id: "fallback_detection",
    label: "Fallback Detection",
    description:
      "Fallback sessionStorage em staging bloqueia acceptance e não declara persistência remota.",
    stepDefs: [
      { id: "detect_fallback", label: "Detectar fallback sessionStorage" },
      { id: "block_acceptance", label: "Bloquear acceptance" },
      { id: "no_remote_claim", label: "Não declarar persistência remota" },
      { id: "show_cause", label: "Apresentar causa" },
      { id: "preserve_local", label: "Dados locais preservados" },
    ],
  },
  {
    id: "multi_agent_isolation",
    label: "Multi-Agent Isolation",
    description:
      "Métricas e histórico isolados por assignedAgentId; executionId único no scope combined.",
    stepDefs: [
      { id: "diagnostics_metrics", label: "Métricas diagnostics isoladas" },
      { id: "release_metrics", label: "Métricas release isoladas" },
      { id: "filter_by_agent", label: "Histórico filtrado por agentId" },
      { id: "no_duplicate_execution", label: "executionId sem duplicata combined" },
    ],
  },
];

export function buildInitialAcceptanceScenarios(): StagingPersistenceAcceptanceScenario[] {
  return STAGING_PERSISTENCE_ACCEPTANCE_SCENARIO_DEFS.map((def) => ({
    id: def.id,
    label: def.label,
    description: def.description,
    missionType: def.missionType,
    agentId: def.agentId,
    steps: pendingSteps(def.stepDefs),
    status: "not_run",
    blockers: [],
    warnings: [],
    evidence: [],
  }));
}

export function findAcceptanceScenarioDef(id: StagingPersistenceAcceptanceScenarioId) {
  return STAGING_PERSISTENCE_ACCEPTANCE_SCENARIO_DEFS.find((def) => def.id === id);
}
