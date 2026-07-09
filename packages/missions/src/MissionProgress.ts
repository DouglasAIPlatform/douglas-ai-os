import type { MissionProgressState } from "./MissionTypes";
import type { IMissionProgress } from "./interfaces/IMissionProgress";

export class MissionProgress implements IMissionProgress {
  initialize(totalSteps = 0): MissionProgressState {
    return {
      percent: 0,
      completedSteps: 0,
      totalSteps: totalSteps || undefined,
      currentStep: totalSteps ? "Step 1" : undefined,
    };
  }

  update(
    current: MissionProgressState,
    patch: Partial<MissionProgressState>,
  ): MissionProgressState {
    const next: MissionProgressState = { ...current, ...patch };

    if (
      next.totalSteps &&
      next.completedSteps !== undefined &&
      patch.percent === undefined
    ) {
      next.percent = this.percentFromSteps(next.completedSteps, next.totalSteps);
    }

    return next;
  }

  advanceStep(current: MissionProgressState): MissionProgressState {
    const totalSteps = current.totalSteps ?? 0;
    const completedSteps = (current.completedSteps ?? 0) + 1;

    return this.update(current, {
      completedSteps,
      percent: totalSteps ? this.percentFromSteps(completedSteps, totalSteps) : current.percent,
      currentStep: totalSteps
        ? `Step ${Math.min(completedSteps + 1, totalSteps)}`
        : current.currentStep,
    });
  }

  percentFromSteps(completedSteps: number, totalSteps: number): number {
    if (!totalSteps) return 0;
    return Math.min(100, Math.round((completedSteps / totalSteps) * 100));
  }
}
