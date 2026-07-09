import type {
  MissionData,
  MissionBoardView,
  MissionFilter,
  MissionInput,
  MissionProgressState,
  MissionScope,
  MissionStatus,
} from "../MissionTypes";
import type { IMissionRepository } from "./IMissionRepository";

export interface IMissionManager {
  create(input: MissionInput): MissionData;
  get(id: string): MissionData | undefined;
  list(filter?: MissionFilter): MissionData[];
  updateProgress(
    id: string,
    progress: Partial<MissionProgressState>,
  ): MissionData | undefined;
  linkScope(id: string, scope: MissionScope): MissionData | undefined;
  transition(id: string, status: MissionStatus): MissionData | undefined;
  start(id: string): MissionData | undefined;
  complete(id: string): MissionData | undefined;
  block(id: string, reason?: string): MissionData | undefined;
  archive(id: string): MissionData | undefined;
  getRepository(): IMissionRepository;
}

export interface IMissionBoard {
  build(filter?: MissionFilter): MissionBoardView;
  getColumn(status: MissionStatus, filter?: MissionFilter): MissionData[];
}
