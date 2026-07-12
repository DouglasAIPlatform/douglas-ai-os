export interface MissionExecutionEventRecord {
  executionId: string;
  sequence: number;
  eventType: string;
  status?: string;
  progress?: number;
  step?: string;
  summary?: string;
  recordedAt: string;
}

export function buildMissionExecutionEventRecord(input: {
  executionId: string;
  sequence: number;
  eventType: string;
  status?: string;
  progress?: number;
  step?: string;
  summary?: string;
  recordedAt?: string;
}): MissionExecutionEventRecord {
  return {
    executionId: input.executionId,
    sequence: input.sequence,
    eventType: input.eventType,
    ...(input.status ? { status: input.status } : {}),
    ...(typeof input.progress === "number" ? { progress: input.progress } : {}),
    ...(input.step ? { step: input.step.slice(0, 120) } : {}),
    ...(input.summary ? { summary: input.summary.slice(0, 240) } : {}),
    recordedAt: input.recordedAt ?? new Date().toISOString(),
  };
}
