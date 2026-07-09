import type {
  MissionData,
  MissionHistoryAction,
  MissionHistoryEntry,
} from "./MissionTypes";
import type { IMissionHistory } from "./interfaces/IMissionHistory";

export class MissionHistory implements IMissionHistory {
  private entries: MissionHistoryEntry[] = [];
  private readonly capacity: number;

  constructor(capacity = 500) {
    this.capacity = capacity;
  }

  record(action: MissionHistoryAction, snapshot: MissionData): MissionHistoryEntry {
    const entry: MissionHistoryEntry = {
      id: `mission-history:${Date.now()}:${this.entries.length}`,
      missionId: snapshot.id,
      action,
      snapshot,
      timestamp: new Date().toISOString(),
    };

    this.entries = [entry, ...this.entries].slice(0, this.capacity);
    return entry;
  }

  getByMissionId(missionId: string): MissionHistoryEntry[] {
    return this.entries.filter((entry) => entry.missionId === missionId);
  }

  getByAction(action: MissionHistoryAction): MissionHistoryEntry[] {
    return this.entries.filter((entry) => entry.action === action);
  }

  getRecent(limit = 20): MissionHistoryEntry[] {
    return this.entries.slice(0, limit);
  }

  clear(): void {
    this.entries = [];
  }
}
