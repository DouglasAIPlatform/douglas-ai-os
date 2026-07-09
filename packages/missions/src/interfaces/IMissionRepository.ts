import type {
  MissionData,
  MissionFilter,
  MissionInput,
} from "../MissionTypes";

export interface IMissionRepository {
  create(input: MissionInput): MissionData;
  get(id: string): MissionData | undefined;
  update(id: string, patch: Partial<MissionData>): MissionData | undefined;
  list(filter?: MissionFilter): MissionData[];
  remove(id: string): boolean;
  seed(missions: MissionData[]): void;
  clear(): void;
}

export interface IMissionExecutor {
  canExecute(mission: MissionData): boolean;
  execute(mission: MissionData): Promise<{ success: boolean; message: string }>;
}
