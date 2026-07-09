import { createContext } from "react";
import type { MissionManager } from "./MissionManager";
import type {
  MissionBoardView,
  MissionData,
  MissionFilter,
  MissionHistoryEntry,
  MissionTimelineEntry,
} from "./MissionTypes";

export interface MissionControlContextValue {
  manager: MissionManager;
  board: MissionBoardView;
  missions: MissionData[];
  getMission: (id: string) => MissionData | undefined;
  getTimeline: (missionId: string) => MissionTimelineEntry[];
  getHistory: (missionId: string) => MissionHistoryEntry[];
}

export const MissionControlContext = createContext<MissionControlContextValue | null>(
  null,
);

export type { MissionFilter };
