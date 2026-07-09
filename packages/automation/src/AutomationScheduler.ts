import type { AutomationTriggerType } from "./AutomationTypes";

export interface ScheduledAutomationJob {
  id: string;
  automationId: string;
  triggerType: AutomationTriggerType;
  cronExpression?: string;
  scheduledFor: string;
  status: "pending" | "dispatched" | "cancelled";
  createdAt: string;
}

export interface ScheduleInput {
  automationId: string;
  triggerType: AutomationTriggerType;
  cronExpression?: string;
  scheduledFor?: string;
}

export class AutomationScheduler {
  private jobs: ScheduledAutomationJob[] = [];

  schedule(input: ScheduleInput): ScheduledAutomationJob {
    const job: ScheduledAutomationJob = {
      id: `schedule:${Date.now()}:${this.jobs.length}`,
      automationId: input.automationId,
      triggerType: input.triggerType,
      cronExpression: input.cronExpression,
      scheduledFor: input.scheduledFor ?? new Date().toISOString(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    this.jobs = [...this.jobs, job].sort((a, b) =>
      a.scheduledFor.localeCompare(b.scheduledFor),
    );

    return job;
  }

  getDueJobs(now = new Date()): ScheduledAutomationJob[] {
    return this.jobs.filter(
      (job) =>
        job.status === "pending" && new Date(job.scheduledFor) <= now,
    );
  }

  markDispatched(jobId: string): void {
    this.jobs = this.jobs.map((job) =>
      job.id === jobId ? { ...job, status: "dispatched" } : job,
    );
  }

  cancel(jobId: string): boolean {
    const job = this.jobs.find((item) => item.id === jobId);
    if (!job || job.status !== "pending") return false;

    job.status = "cancelled";
    return true;
  }

  list(automationId?: string): ScheduledAutomationJob[] {
    if (!automationId) return [...this.jobs];
    return this.jobs.filter((job) => job.automationId === automationId);
  }

  pendingCount(): number {
    return this.jobs.filter((job) => job.status === "pending").length;
  }

  clear(): void {
    this.jobs = [];
  }
}
