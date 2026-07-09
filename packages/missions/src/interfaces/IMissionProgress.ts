import type { MissionProgressState } from "../MissionTypes";

export interface IMissionProgress {
  initialize(totalSteps?: number): MissionProgressState;
  update(
    current: MissionProgressState,
    patch: Partial<MissionProgressState>,
  ): MissionProgressState;
  advanceStep(current: MissionProgressState): MissionProgressState;
  percentFromSteps(completedSteps: number, totalSteps: number): number;
}
