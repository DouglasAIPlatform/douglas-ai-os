export type MissionExecutionPersistenceErrorCode =
  | "duplicate_execution"
  | "duplicate_event"
  | "terminal_immutable"
  | "table_missing"
  | "remote_error"
  | "not_configured"
  | "sanitized_rejection";

export interface MissionExecutionPersistenceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: MissionExecutionPersistenceErrorCode;
  usedFallback?: boolean;
  tableMissing?: boolean;
}

export function missionPersistenceOk<T>(data?: T): MissionExecutionPersistenceResult<T> {
  return { success: true, data };
}

export function missionPersistenceFail(
  error: string,
  options: Omit<MissionExecutionPersistenceResult, "success" | "error"> = {},
): MissionExecutionPersistenceResult {
  return { success: false, error, ...options };
}
