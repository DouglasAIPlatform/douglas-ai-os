/** Checks de validação remota de persistência — Sprint 5.54. */

export type MissionPersistenceRemoteCheckStatus =
  | "unknown"
  | "pending"
  | "passed"
  | "warning"
  | "failed"
  | "blocked";

export type MissionPersistenceRemoteCheckId =
  | "supabase_configured"
  | "tables_accessible"
  | "rls_active"
  | "create_execution_authorized"
  | "create_blocked_viewer"
  | "timeline_persisted"
  | "completion_persisted"
  | "read_after_reload"
  | "fallback_inactive"
  | "pending_queue_empty"
  | "operational_diagnostic_persisted"
  | "release_readiness_review_persisted"
  | "duplicate_execution_rejected"
  | "duplicate_event_rejected"
  | "unknown_mission_type_rejected";

export interface MissionPersistenceRemoteCheck {
  id: MissionPersistenceRemoteCheckId;
  label: string;
  status: MissionPersistenceRemoteCheckStatus;
  message: string;
  blocking: boolean;
}

export const MISSION_PERSISTENCE_REMOTE_CHECK_LABELS: Record<
  MissionPersistenceRemoteCheckId,
  string
> = {
  supabase_configured: "Supabase configurado",
  tables_accessible: "Tabelas acessíveis",
  rls_active: "RLS ativo",
  create_execution_authorized: "Create permitido (role autorizada)",
  create_blocked_viewer: "Create bloqueado para viewer",
  timeline_persisted: "Timeline persistida",
  completion_persisted: "Conclusão persistida",
  read_after_reload: "Leitura após reload",
  fallback_inactive: "Fallback inativo",
  pending_queue_empty: "Pending queue vazia",
  operational_diagnostic_persisted: "operational_diagnostic persistido",
  release_readiness_review_persisted: "release_readiness_review persistido",
  duplicate_execution_rejected: "executionId duplicado rejeitado",
  duplicate_event_rejected: "Evento duplicado rejeitado",
  unknown_mission_type_rejected: "Mission type desconhecido rejeitado",
};

export function buildInitialRemoteChecks(): MissionPersistenceRemoteCheck[] {
  return (Object.keys(MISSION_PERSISTENCE_REMOTE_CHECK_LABELS) as MissionPersistenceRemoteCheckId[]).map(
    (id) => ({
      id,
      label: MISSION_PERSISTENCE_REMOTE_CHECK_LABELS[id],
      status: "unknown" as const,
      message: "Aguardando validação em staging.",
      blocking: id !== "create_blocked_viewer",
    }),
  );
}
