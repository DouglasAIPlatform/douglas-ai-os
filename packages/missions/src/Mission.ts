import type { MissionData, MissionExecutionPolicy, MissionInput } from "./MissionTypes";

function defaultExecution(
  partial?: Partial<MissionExecutionPolicy>,
): MissionExecutionPolicy {
  return {
    mode: partial?.mode ?? "manual",
    retryable: partial?.retryable ?? false,
    maxRetries: partial?.maxRetries ?? 0,
    scheduledAt: partial?.scheduledAt,
    executorId: partial?.executorId,
  };
}

export class Mission {
  constructor(public readonly data: MissionData) {}

  get id() {
    return this.data.id;
  }

  get title() {
    return this.data.title;
  }

  get status() {
    return this.data.status;
  }

  get priority() {
    return this.data.priority;
  }

  get isIndependent(): boolean {
    return true;
  }

  get isAutomatic(): boolean {
    return this.data.execution.mode === "automatic";
  }

  get isReadyForAutoExecution(): boolean {
    return (
      this.isAutomatic &&
      this.data.status === "planned" &&
      Boolean(this.data.execution.executorId)
    );
  }

  withData(data: MissionData): Mission {
    return new Mission(data);
  }

  static fromData(data: MissionData): Mission {
    return new Mission(data);
  }

  static createInputDefaults(input: MissionInput): Omit<MissionData, "id" | "createdAt" | "updatedAt"> {
    return {
      title: input.title,
      description: input.description ?? "",
      status: "draft",
      priority: input.priority ?? "normal",
      progress: { percent: 0, completedSteps: 0 },
      scopes: input.scopes ?? [],
      execution: defaultExecution(input.execution),
      metadata: input.metadata ?? {},
    };
  }
}

export function createMission(data: MissionData): Mission {
  return Mission.fromData(data);
}
