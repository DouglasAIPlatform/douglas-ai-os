export type MissionTypeCatalogMismatchKind =
  | "mission_type_missing"
  | "mission_type_extra"
  | "unknown_mission_type"
  | "no_access_policy"
  | "no_executor"
  | "sql_accepts_unknown";

export type MissionTypeCatalogMismatchSeverity = "error" | "warning";

export interface MissionTypeCatalogMismatch {
  kind: MissionTypeCatalogMismatchKind;
  severity: MissionTypeCatalogMismatchSeverity;
  sourceId: string;
  message: string;
  missionType?: string;
}

export function createMissionTypeCatalogMismatch(
  kind: MissionTypeCatalogMismatchKind,
  severity: MissionTypeCatalogMismatchSeverity,
  sourceId: string,
  message: string,
  missionType?: string,
): MissionTypeCatalogMismatch {
  return { kind, severity, sourceId, message, missionType };
}
