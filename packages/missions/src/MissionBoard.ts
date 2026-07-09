import type {
  MissionBoardView,
  MissionData,
  MissionFilter,
  MissionStatus,
} from "./MissionTypes";
import { MISSION_BOARD_STATUSES, MISSION_STATUS_LABELS } from "./MissionTypes";
import { compareMissionPriority } from "./MissionPriority";
import type { IMissionBoard } from "./interfaces/IMissionManager";
import type { IMissionRepository } from "./interfaces/IMissionRepository";

function sortMissions(missions: MissionData[]): MissionData[] {
  return [...missions].sort(
    (a, b) =>
      compareMissionPriority(a.priority, b.priority) ||
      b.updatedAt.localeCompare(a.updatedAt),
  );
}

export class MissionBoard implements IMissionBoard {
  constructor(private readonly repository: IMissionRepository) {}

  build(filter?: MissionFilter): MissionBoardView {
    const missions = this.repository.list(filter);
    const columns = MISSION_BOARD_STATUSES.map((status) => ({
      status,
      label: MISSION_STATUS_LABELS[status],
      missions: sortMissions(missions.filter((mission) => mission.status === status)),
    }));

    return {
      columns,
      total: missions.length,
      activeCount: missions.filter((mission) => mission.status === "active").length,
      completedCount: missions.filter((mission) => mission.status === "completed").length,
    };
  }

  getColumn(status: MissionStatus, filter?: MissionFilter): MissionData[] {
    return sortMissions(
      this.repository.list(filter).filter((mission) => mission.status === status),
    );
  }
}
