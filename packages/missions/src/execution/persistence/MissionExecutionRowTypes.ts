/** Row shapes alinhados a supabase/migrations/20250710210000_mission_executions.sql */

export type MissionExecutionRowStatus =
  | "created"
  | "validated"
  | "planned"
  | "assigned"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "interrupted"
  | "recovery_required";

export interface MissionExecutionRow {
  execution_id: string;
  mission_id: string;
  mission_type: string;
  attempt: number;
  status: MissionExecutionRowStatus;
  board_status: string | null;
  progress: number;
  assigned_agent_id: string | null;
  created_by: string;
  created_by_user_id: string;
  operator_profile_id: string | null;
  correlation_id: string | null;
  request_id: string | null;
  result_summary: string | null;
  sanitized_error_code: string | null;
  sanitized_error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MissionExecutionEventRow {
  id: string;
  execution_id: string;
  sequence: number;
  event_type: string;
  status: string | null;
  progress: number | null;
  step: string | null;
  summary: string | null;
  recorded_at: string;
}

export const MISSION_EXECUTION_TABLES = {
  executions: "mission_executions",
  events: "mission_execution_events",
} as const;
