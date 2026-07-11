import type { MissionExecutionContext, MissionExecutionResult } from "./MissionExecutionTypes";

export type MissionExecutionDuplicateDecision =
  | "allow"
  | "reject_same_execution"
  | "reject_running_mission"
  | "allow_retry";

export interface MissionExecutionIdempotencyRules {
  rejectDuplicateExecutionId: boolean;
  rejectConcurrentRunning: boolean;
  preservePreviousResults: boolean;
}

export const DEFAULT_MISSION_EXECUTION_IDEMPOTENCY_POLICY: MissionExecutionIdempotencyRules =
  {
    rejectDuplicateExecutionId: true,
    rejectConcurrentRunning: true,
    preservePreviousResults: true,
  };

export class MissionExecutionRegistry {
  private readonly byExecutionId = new Map<string, MissionExecutionContext>();
  private readonly resultsByExecutionId = new Map<string, MissionExecutionResult>();
  private runningMissionIds = new Set<string>();

  register(context: MissionExecutionContext): void {
    this.byExecutionId.set(context.executionId, context);
    if (context.status === "running" || context.status === "assigned") {
      this.runningMissionIds.add(context.missionId);
    }
  }

  update(context: MissionExecutionContext): void {
    this.byExecutionId.set(context.executionId, context);
    if (context.status === "running" || context.status === "assigned") {
      this.runningMissionIds.add(context.missionId);
    }
    if (
      context.status === "completed" ||
      context.status === "failed" ||
      context.status === "cancelled"
    ) {
      this.runningMissionIds.delete(context.missionId);
    }
  }

  getByExecutionId(executionId: string): MissionExecutionContext | undefined {
    return this.byExecutionId.get(executionId);
  }

  getResult(executionId: string): MissionExecutionResult | undefined {
    return this.resultsByExecutionId.get(executionId);
  }

  storeResult(result: MissionExecutionResult): void {
    this.resultsByExecutionId.set(result.context.executionId, result);
    this.update(result.context);
  }

  isMissionRunning(missionId: string): boolean {
    return this.runningMissionIds.has(missionId);
  }

  list(): MissionExecutionContext[] {
    return [...this.byExecutionId.values()];
  }
}

export class MissionExecutionIdempotencyGuard {
  constructor(
    private readonly registry: MissionExecutionRegistry,
    private readonly rules: MissionExecutionIdempotencyRules = DEFAULT_MISSION_EXECUTION_IDEMPOTENCY_POLICY,
  ) {}

  evaluate(input: {
    executionId: string;
    missionId: string;
    isRetry?: boolean;
  }): MissionExecutionDuplicateDecision {
    const existing = this.registry.getByExecutionId(input.executionId);

    if (existing && this.rules.rejectDuplicateExecutionId && !input.isRetry) {
      return "reject_same_execution";
    }

    if (
      this.registry.isMissionRunning(input.missionId) &&
      this.rules.rejectConcurrentRunning &&
      !input.isRetry
    ) {
      return "reject_running_mission";
    }

    if (input.isRetry) {
      return "allow_retry";
    }

    return "allow";
  }
}
