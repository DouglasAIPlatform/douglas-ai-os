import type { AutomationRunStatus, AutomationTriggerType } from "./AutomationTypes";
import type { AutomationActionResult } from "./AutomationAction";

export interface AutomationRunRecord {
  id: string;
  automationId: string;
  triggerType: AutomationTriggerType;
  status: AutomationRunStatus;
  actionResults: AutomationActionResult[];
  context: Record<string, string | number | boolean | null | undefined>;
  scheduledFor?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface AutomationHistoryEntry {
  id: string;
  runId: string;
  automationId: string;
  status: AutomationRunStatus;
  triggerType: AutomationTriggerType;
  snapshot: AutomationRunRecord;
  createdAt: string;
}

export class AutomationHistory {
  private entries: AutomationHistoryEntry[] = [];
  private readonly capacity: number;

  constructor(capacity = 500) {
    this.capacity = capacity;
  }

  record(run: AutomationRunRecord): AutomationHistoryEntry {
    const entry: AutomationHistoryEntry = {
      id: `history:${Date.now()}:${this.entries.length}`,
      runId: run.id,
      automationId: run.automationId,
      status: run.status,
      triggerType: run.triggerType,
      snapshot: run,
      createdAt: new Date().toISOString(),
    };

    this.entries = [entry, ...this.entries].slice(0, this.capacity);
    return entry;
  }

  getByAutomationId(automationId: string): AutomationHistoryEntry[] {
    return this.entries.filter((entry) => entry.automationId === automationId);
  }

  getByRunId(runId: string): AutomationHistoryEntry[] {
    return this.entries.filter((entry) => entry.runId === runId);
  }

  getRecent(limit = 20): AutomationHistoryEntry[] {
    return this.entries.slice(0, limit);
  }

  getAll(): AutomationHistoryEntry[] {
    return [...this.entries];
  }

  count(): number {
    return this.entries.length;
  }

  clear(): void {
    this.entries = [];
  }
}

export function createAutomationRun(input: {
  id: string;
  automationId: string;
  triggerType: AutomationTriggerType;
  context?: AutomationRunRecord["context"];
  scheduledFor?: string;
}): AutomationRunRecord {
  return {
    id: input.id,
    automationId: input.automationId,
    triggerType: input.triggerType,
    status: input.scheduledFor ? "scheduled" : "pending",
    actionResults: [],
    context: input.context ?? {},
    scheduledFor: input.scheduledFor,
    createdAt: new Date().toISOString(),
  };
}

export function updateAutomationRunStatus(
  run: AutomationRunRecord,
  status: AutomationRunStatus,
): AutomationRunRecord {
  const now = new Date().toISOString();

  return {
    ...run,
    status,
    startedAt: status === "running" ? run.startedAt ?? now : run.startedAt,
    completedAt:
      status === "completed" || status === "failed" || status === "cancelled"
        ? now
        : run.completedAt,
  };
}
