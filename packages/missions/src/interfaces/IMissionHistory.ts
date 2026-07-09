import type {
  MissionData,
  MissionHistoryAction,
  MissionHistoryEntry,
} from "../MissionTypes";

export interface IMissionHistory {
  record(action: MissionHistoryAction, snapshot: MissionData): MissionHistoryEntry;
  getByMissionId(missionId: string): MissionHistoryEntry[];
  getByAction(action: MissionHistoryAction): MissionHistoryEntry[];
  getRecent(limit?: number): MissionHistoryEntry[];
  clear(): void;
}
