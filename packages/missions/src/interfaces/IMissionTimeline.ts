import type { MissionTimelineEntry, MissionTimelineEventType } from "../MissionTypes";

export interface IMissionTimeline {
  record(
    missionId: string,
    type: MissionTimelineEventType,
    title: string,
    description?: string,
    metadata?: Record<string, string | number | boolean | null>,
  ): MissionTimelineEntry;
  getByMissionId(missionId: string): MissionTimelineEntry[];
  getRecent(limit?: number): MissionTimelineEntry[];
  clear(): void;
}
