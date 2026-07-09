import type { MissionTimelineEntry, MissionTimelineEventType } from "./MissionTypes";
import type { IMissionTimeline } from "./interfaces/IMissionTimeline";

export class MissionTimeline implements IMissionTimeline {
  private entries: MissionTimelineEntry[] = [];
  private readonly capacity: number;

  constructor(capacity = 500) {
    this.capacity = capacity;
  }

  record(
    missionId: string,
    type: MissionTimelineEventType,
    title: string,
    description?: string,
    metadata?: Record<string, string | number | boolean | null>,
  ): MissionTimelineEntry {
    const entry: MissionTimelineEntry = {
      id: `mission-timeline:${Date.now()}:${this.entries.length}`,
      missionId,
      type,
      title,
      description,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.entries = [entry, ...this.entries].slice(0, this.capacity);
    return entry;
  }

  getByMissionId(missionId: string): MissionTimelineEntry[] {
    return this.entries.filter((entry) => entry.missionId === missionId);
  }

  getRecent(limit = 20): MissionTimelineEntry[] {
    return this.entries.slice(0, limit);
  }

  clear(): void {
    this.entries = [];
  }
}
