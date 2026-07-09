import type { QueueItemStatus, WorkflowDepartment } from "./WorkflowTypes";

export interface QueueItem {
  id: string;
  executionId: string;
  workflowId: string;
  department: WorkflowDepartment;
  priority: number;
  status: QueueItemStatus;
  enqueuedAt: string;
  processedAt?: string;
}

export interface EnqueueInput {
  executionId: string;
  workflowId: string;
  department: WorkflowDepartment;
  priority?: number;
}

export class Queue {
  private items: QueueItem[] = [];

  enqueue(input: EnqueueInput): QueueItem {
    const item: QueueItem = {
      id: `queue:${Date.now()}:${this.items.length}`,
      executionId: input.executionId,
      workflowId: input.workflowId,
      department: input.department,
      priority: input.priority ?? 0,
      status: "waiting",
      enqueuedAt: new Date().toISOString(),
    };

    this.items = [...this.items, item].sort(
      (a, b) => b.priority - a.priority || a.enqueuedAt.localeCompare(b.enqueuedAt),
    );

    return item;
  }

  peek(): QueueItem | undefined {
    return this.items.find((item) => item.status === "waiting");
  }

  dequeue(): QueueItem | undefined {
    const index = this.items.findIndex((item) => item.status === "waiting");
    if (index === -1) return undefined;

    const item = this.items[index];
    const updated: QueueItem = {
      ...item,
      status: "processing",
      processedAt: new Date().toISOString(),
    };

    this.items[index] = updated;
    return updated;
  }

  complete(itemId: string, failed = false): void {
    this.items = this.items.map((item) =>
      item.id === itemId
        ? { ...item, status: failed ? "failed" : "done" }
        : item,
    );
  }

  list(department?: WorkflowDepartment): QueueItem[] {
    if (!department) return [...this.items];
    return this.items.filter((item) => item.department === department);
  }

  size(): number {
    return this.items.filter((item) => item.status === "waiting").length;
  }

  clear(): void {
    this.items = [];
  }
}
