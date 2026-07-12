import type { MissionExecutionEventRecord } from "./MissionExecutionEventRecord";
import type { MissionExecutionPersistenceHealth } from "./MissionExecutionPersistenceHealth";
import type { MissionExecutionRecoveryDecision } from "./MissionExecutionRecoveryPolicy";
import { evaluateMissionExecutionRecovery } from "./MissionExecutionRecoveryPolicy";
import type {
  MissionExecutionContext,
  MissionExecutionResult,
} from "../MissionExecutionTypes";
import type { MissionExecutionRegistry } from "../MissionExecutionIdempotency";

export interface MissionExecutionRehydrationResult {
  executions: MissionExecutionContext[];
  latestExecution?: MissionExecutionContext;
  latestEvents: MissionExecutionEventRecord[];
  recoveryDecisions: MissionExecutionRecoveryDecision[];
  rehydratedCount: number;
}

export interface MissionExecutionRehydrationInput {
  listRecentExecutions: (limit?: number) => Promise<MissionExecutionContext[]>;
  listExecutionEvents: (executionId: string) => Promise<MissionExecutionEventRecord[]>;
  registry?: MissionExecutionRegistry;
  limit?: number;
}

export async function rehydrateMissionExecutions(
  input: MissionExecutionRehydrationInput,
): Promise<MissionExecutionRehydrationResult> {
  const limit = input.limit ?? 10;
  const executions = await input.listRecentExecutions(limit);
  const recoveryDecisions: MissionExecutionRecoveryDecision[] = [];
  const normalized: MissionExecutionContext[] = [];

  for (const execution of executions) {
    const decision = evaluateMissionExecutionRecovery(execution.status);
    recoveryDecisions.push(decision);

    let context = execution;
    if (decision.nextStatus) {
      context = {
        ...execution,
        status: decision.nextStatus,
        sanitizedError: decision.reason,
        completedAt: execution.completedAt ?? new Date().toISOString(),
      };
    }

    normalized.push(context);
    input.registry?.register(context);

    if (context.status === "completed" || context.status === "failed" || context.status === "cancelled") {
      const result: MissionExecutionResult = {
        context,
        success: context.status === "completed",
        summary: context.resultSummary ?? context.sanitizedError ?? context.status,
      };
      input.registry?.storeResult(result);
    }
  }

  const latestExecution = normalized[0];
  const latestEvents = latestExecution
    ? await input.listExecutionEvents(latestExecution.executionId)
    : [];

  return {
    executions: normalized,
    latestExecution,
    latestEvents,
    recoveryDecisions,
    rehydratedCount: normalized.length,
  };
}

export function buildRehydrationHealthPatch(
  health: MissionExecutionPersistenceHealth,
): Partial<MissionExecutionPersistenceHealth> {
  return {
    ...health,
    lastHydratedAt: new Date().toISOString(),
  };
}
