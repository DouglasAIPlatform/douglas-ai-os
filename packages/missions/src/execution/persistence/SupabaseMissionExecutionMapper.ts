import type {
  MissionExecutionEventRow,
  MissionExecutionRow,
} from "./MissionExecutionRowTypes";
import type { MissionExecutionEventRecord } from "./MissionExecutionEventRecord";
import { sanitizeMissionPersistenceText } from "./MissionExecutionSanitizer";
import type {
  MissionExecutionContext,
  MissionExecutionRequest,
  MissionExecutionResult,
  MissionExecutionStatus,
} from "../MissionExecutionTypes";
import { mapExecutionStatusToMissionStatus } from "../MissionExecutionStatusMapper";

export interface MissionExecutionPersistenceWriteMeta {
  createdByUserId: string;
  operatorProfileId?: string;
}

export function missionExecutionContextToRow(
  context: MissionExecutionContext,
  meta: MissionExecutionPersistenceWriteMeta,
): Omit<MissionExecutionRow, "created_at" | "updated_at"> {
  return {
    execution_id: context.executionId,
    mission_id: context.missionId,
    mission_type: context.request.missionType,
    attempt: context.attempt,
    status: context.status,
    board_status: mapExecutionStatusToMissionStatus(context.status),
    progress: context.progress,
    assigned_agent_id: context.assignedAgentId ?? null,
    created_by: context.createdBy,
    created_by_user_id: meta.createdByUserId,
    operator_profile_id: meta.operatorProfileId ?? context.operatorProfileId ?? null,
    correlation_id: context.correlationId,
    request_id: context.requestId,
    result_summary: sanitizeMissionPersistenceText(context.resultSummary),
    sanitized_error_code: null,
    sanitized_error_message: sanitizeMissionPersistenceText(context.sanitizedError),
    started_at: context.startedAt ?? null,
    completed_at: context.completedAt ?? null,
  };
}

export function missionExecutionRowToContext(row: MissionExecutionRow): MissionExecutionContext {
  const request: MissionExecutionRequest = {
    executionId: row.execution_id,
    correlationId: row.correlation_id ?? row.execution_id,
    requestId: row.request_id ?? row.execution_id,
    createdBy: row.created_by,
    createdByRole: "operator",
    createdByUserId: row.created_by_user_id,
    operatorProfileId: row.operator_profile_id ?? undefined,
    missionType: row.mission_type,
    title: row.mission_type,
    missionId: row.mission_id,
  };

  return {
    request,
    status: row.status as MissionExecutionStatus,
    missionId: row.mission_id,
    executionId: row.execution_id,
    correlationId: row.correlation_id ?? row.execution_id,
    requestId: row.request_id ?? row.execution_id,
    createdBy: row.created_by,
    createdByUserId: row.created_by_user_id,
    operatorProfileId: row.operator_profile_id ?? undefined,
    assignedAgentId: row.assigned_agent_id ?? undefined,
    progress: row.progress,
    attempt: row.attempt,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    resultSummary: row.result_summary ?? undefined,
    sanitizedError: row.sanitized_error_message ?? undefined,
  };
}

export function missionExecutionResultFromRow(
  row: MissionExecutionRow,
): MissionExecutionResult {
  const context = missionExecutionRowToContext(row);
  return {
    context,
    success: row.status === "completed",
    summary: row.result_summary ?? row.sanitized_error_message ?? row.status,
  };
}

export function missionExecutionEventToRow(
  event: MissionExecutionEventRecord,
): Omit<MissionExecutionEventRow, "id"> {
  return {
    execution_id: event.executionId,
    sequence: event.sequence,
    event_type: event.eventType,
    status: event.status ?? null,
    progress: event.progress ?? null,
    step: event.step ?? null,
    summary: sanitizeMissionPersistenceText(event.summary),
    recorded_at: event.recordedAt,
  };
}

export function missionExecutionEventRowToRecord(
  row: MissionExecutionEventRow,
): MissionExecutionEventRecord {
  return {
    executionId: row.execution_id,
    sequence: row.sequence,
    eventType: row.event_type,
    status: row.status ?? undefined,
    progress: row.progress ?? undefined,
    step: row.step ?? undefined,
    summary: row.summary ?? undefined,
    recordedAt: row.recorded_at,
  };
}

export function contextToTimelineEvent(
  context: MissionExecutionContext,
  sequence: number,
  eventType: string,
  summary?: string,
): MissionExecutionEventRecord {
  return {
    executionId: context.executionId,
    sequence,
    eventType,
    status: context.status,
    progress: context.progress,
    step: context.currentStep,
    summary: summary ?? context.resultSummary,
    recordedAt: new Date().toISOString(),
  };
}
