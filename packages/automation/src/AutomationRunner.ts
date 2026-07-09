import { simulateAutomationAction } from "./AutomationAction";
import { createAutomationEvent, AutomationEventBus } from "./AutomationEvent";
import {
  AutomationHistory,
  createAutomationRun,
  updateAutomationRunStatus,
  type AutomationRunRecord,
} from "./AutomationHistory";
import { AutomationRegistry } from "./AutomationRegistry";
import { AutomationScheduler } from "./AutomationScheduler";
import { isAutomationTriggerEnabled } from "./AutomationTrigger";
import type {
  AutomationContextData,
  AutomationDefinition,
  AutomationFilter,
  AutomationRunFilter,
  AutomationTriggerType,
} from "./AutomationTypes";

export interface RunAutomationInput {
  automationId: string;
  triggerType?: AutomationTriggerType;
  context?: AutomationContextData;
  scheduledFor?: string;
}

export interface DispatchInternalEventInput {
  eventName: string;
  payload?: AutomationContextData;
}

export class AutomationRunner {
  private runs = new Map<string, AutomationRunRecord>();

  constructor(
    private readonly registry: AutomationRegistry,
    private readonly scheduler: AutomationScheduler,
    private readonly history: AutomationHistory,
    private readonly eventBus: AutomationEventBus,
  ) {}

  getRegistry(): AutomationRegistry {
    return this.registry;
  }

  getScheduler(): AutomationScheduler {
    return this.scheduler;
  }

  getHistory(): AutomationHistory {
    return this.history;
  }

  getEventBus(): AutomationEventBus {
    return this.eventBus;
  }

  bootstrap(automations: AutomationDefinition[]): void {
    this.registry.registerMany(automations);

    automations.forEach((automation) => {
      if (automation.trigger.type === "cron" && automation.status === "active") {
        this.scheduler.schedule({
          automationId: automation.id,
          triggerType: "cron",
          cronExpression: String(automation.trigger.config.cron ?? "0 * * * *"),
        });
      }
    });
  }

  run(input: RunAutomationInput): AutomationRunRecord | null {
    const automation = this.registry.get(input.automationId);
    if (!automation || automation.status !== "active") return null;
    if (!isAutomationTriggerEnabled(automation.trigger)) return null;

    const triggerType = input.triggerType ?? automation.trigger.type;
    const run = createAutomationRun({
      id: `run:${Date.now()}:${this.runs.size}`,
      automationId: automation.id,
      triggerType,
      context: input.context,
      scheduledFor: input.scheduledFor,
    });

    this.runs.set(run.id, run);
    this.eventBus.emit(
      createAutomationEvent("automation:triggered", input.context ?? {}, {
        automationId: automation.id,
        runId: run.id,
      }),
    );

    if (input.scheduledFor) {
      this.scheduler.schedule({
        automationId: automation.id,
        triggerType,
        scheduledFor: input.scheduledFor,
      });
      const scheduled = updateAutomationRunStatus(run, "scheduled");
      this.runs.set(run.id, scheduled);
      this.history.record(scheduled);
      return scheduled;
    }

    return this.executeRun(run, automation);
  }

  processScheduled(now = new Date()): AutomationRunRecord[] {
    const dueJobs = this.scheduler.getDueJobs(now);
    const results: AutomationRunRecord[] = [];

    dueJobs.forEach((job) => {
      const automation = this.registry.get(job.automationId);
      if (!automation) return;

      const run = createAutomationRun({
        id: `run:${Date.now()}:${this.runs.size + results.length}`,
        automationId: job.automationId,
        triggerType: job.triggerType,
        scheduledFor: job.scheduledFor,
      });

      this.scheduler.markDispatched(job.id);
      const completed = this.executeRun(run, automation);
      if (completed) results.push(completed);
    });

    return results;
  }

  dispatchInternalEvent(input: DispatchInternalEventInput): AutomationRunRecord[] {
    const automations = this.registry.findByInternalEvent(input.eventName);

    return automations
      .map((automation) =>
        this.run({
          automationId: automation.id,
          triggerType: "internal_event",
          context: {
            ...input.payload,
            eventName: input.eventName,
          },
        }),
      )
      .filter((run): run is AutomationRunRecord => Boolean(run));
  }

  private executeRun(
    run: AutomationRunRecord,
    automation: AutomationDefinition,
  ): AutomationRunRecord {
    let current = updateAutomationRunStatus(run, "running");
    this.eventBus.emit(
      createAutomationEvent("automation:started", current.context, {
        automationId: automation.id,
        runId: current.id,
      }),
    );

    const actionResults = [...automation.actions]
      .sort((a, b) => a.order - b.order)
      .map((action) => simulateAutomationAction(action));

    current = {
      ...current,
      actionResults,
      status: "completed",
      completedAt: new Date().toISOString(),
    };

    this.runs.set(current.id, current);
    this.history.record(current);
    this.eventBus.emit(
      createAutomationEvent("automation:completed", current.context, {
        automationId: automation.id,
        runId: current.id,
      }),
    );

    return current;
  }

  getRun(runId: string): AutomationRunRecord | undefined {
    return this.runs.get(runId);
  }

  listRuns(filter: AutomationRunFilter = {}): AutomationRunRecord[] {
    return Array.from(this.runs.values()).filter((run) => {
      if (filter.automationId && run.automationId !== filter.automationId) {
        return false;
      }

      if (filter.status && run.status !== filter.status) {
        return false;
      }

      if (filter.triggerType && run.triggerType !== filter.triggerType) {
        return false;
      }

      return true;
    });
  }

  listAutomations(filter?: AutomationFilter): AutomationDefinition[] {
    return filter ? this.registry.filter(filter) : this.registry.getAll();
  }
}
