import type { PersistableMissionType } from "../../MissionExecutionTypes";
import {
  OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
  RELEASE_READINESS_REVIEW_MISSION_TYPE,
} from "../../MissionExecutionTypes";

export type MissionPersistenceAcceptanceScenarioId =
  | "health_probe"
  | "persist_operational_diagnostic"
  | "persist_release_readiness_review"
  | "timeline_and_completion"
  | "reload_read"
  | "duplicate_execution"
  | "duplicate_event"
  | "reject_unknown_mission_type";

export interface MissionPersistenceAcceptanceScenario {
  id: MissionPersistenceAcceptanceScenarioId;
  label: string;
  missionType?: PersistableMissionType | "invalid_mission_type_probe";
  description: string;
  safeForStaging: boolean;
}

export interface MissionPersistenceAcceptanceResult {
  scenarioId: MissionPersistenceAcceptanceScenarioId;
  passed: boolean;
  summary: string;
  errorCode?: string;
}

export const MISSION_PERSISTENCE_ACCEPTANCE_SCENARIOS: MissionPersistenceAcceptanceScenario[] = [
  {
    id: "health_probe",
    label: "Health probe",
    description: "Verifica tabelas mission_executions acessíveis via client público.",
    safeForStaging: true,
  },
  {
    id: "persist_operational_diagnostic",
    label: "Persist operational_diagnostic",
    missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
    description: "Grava execução acceptance de diagnóstico operacional.",
    safeForStaging: true,
  },
  {
    id: "persist_release_readiness_review",
    label: "Persist release_readiness_review",
    missionType: RELEASE_READINESS_REVIEW_MISSION_TYPE,
    description: "Grava execução acceptance de revisão de readiness.",
    safeForStaging: true,
  },
  {
    id: "timeline_and_completion",
    label: "Timeline + conclusão",
    missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
    description: "Append de eventos ordenados e status terminal completed.",
    safeForStaging: true,
  },
  {
    id: "reload_read",
    label: "Leitura após reload",
    missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
    description: "Re-lê execução gravada como prova de persistência remota.",
    safeForStaging: true,
  },
  {
    id: "duplicate_execution",
    label: "Rejeitar executionId duplicado",
    missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
    description: "Segunda gravação com mesmo execution_id deve falhar.",
    safeForStaging: true,
  },
  {
    id: "duplicate_event",
    label: "Rejeitar evento duplicado",
    missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
    description: "Segundo evento com mesma sequence deve falhar.",
    safeForStaging: true,
  },
  {
    id: "reject_unknown_mission_type",
    label: "Rejeitar mission type desconhecido",
    missionType: "invalid_mission_type_probe",
    description: "Tipo fora do catálogo deve ser rejeitado pelo RLS/policy.",
    safeForStaging: true,
  },
];
