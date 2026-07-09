import type {
  DepartmentAgentRegistration,
  DepartmentEvent,
  DepartmentId,
  DepartmentMetric,
  DepartmentTask,
  DepartmentTaskInput,
  DepartmentTaskStatus,
} from "./DepartmentTypes";
import type { IDepartmentStore } from "./interfaces/IDepartmentStore";

export class InMemoryDepartmentStore implements IDepartmentStore {
  private agents: DepartmentAgentRegistration[] = [];
  private tasks = new Map<string, DepartmentTask>();
  private events: DepartmentEvent[] = [];
  private metrics: DepartmentMetric[] = [];

  registerAgent(
    departmentId: DepartmentId,
    agentId: string,
  ): DepartmentAgentRegistration {
    const existing = this.agents.find(
      (entry) => entry.departmentId === departmentId && entry.agentId === agentId,
    );

    if (existing) return existing;

    const registration: DepartmentAgentRegistration = {
      agentId,
      departmentId,
      registeredAt: new Date().toISOString(),
    };

    this.agents.push(registration);
    return registration;
  }

  getAgents(departmentId?: DepartmentId): DepartmentAgentRegistration[] {
    if (!departmentId) return [...this.agents];
    return this.agents.filter((entry) => entry.departmentId === departmentId);
  }

  addTask(departmentId: DepartmentId, input: DepartmentTaskInput): DepartmentTask {
    const now = new Date().toISOString();
    const task: DepartmentTask = {
      id: `dept-task:${Date.now()}:${this.tasks.size}`,
      departmentId,
      title: input.title,
      description: input.description,
      status: "pending",
      priority: input.priority ?? "normal",
      createdAt: now,
      updatedAt: now,
      metadata: input.metadata ?? {},
    };

    this.tasks.set(task.id, task);
    return task;
  }

  getTasks(departmentId?: DepartmentId): DepartmentTask[] {
    const items = Array.from(this.tasks.values());
    if (!departmentId) return items;
    return items.filter((task) => task.departmentId === departmentId);
  }

  updateTaskStatus(
    taskId: string,
    status: DepartmentTaskStatus,
  ): DepartmentTask | undefined {
    const current = this.tasks.get(taskId);
    if (!current) return undefined;

    const updated: DepartmentTask = {
      ...current,
      status,
      updatedAt: new Date().toISOString(),
    };

    this.tasks.set(taskId, updated);
    return updated;
  }

  publishEvent(
    departmentId: DepartmentId,
    topic: string,
    payload: Record<string, string | number | boolean | null> = {},
  ): DepartmentEvent {
    const event: DepartmentEvent = {
      id: `dept-event:${Date.now()}:${this.events.length}`,
      departmentId,
      topic,
      payload,
      publishedAt: new Date().toISOString(),
    };

    this.events = [event, ...this.events];
    return event;
  }

  getEvents(departmentId?: DepartmentId): DepartmentEvent[] {
    if (!departmentId) return [...this.events];
    return this.events.filter((event) => event.departmentId === departmentId);
  }

  recordMetric(
    departmentId: DepartmentId,
    key: string,
    label: string,
    value: number,
  ): DepartmentMetric {
    const metric: DepartmentMetric = {
      id: `dept-metric:${Date.now()}:${this.metrics.length}`,
      departmentId,
      key,
      label,
      value,
      recordedAt: new Date().toISOString(),
    };

    this.metrics = [metric, ...this.metrics];
    return metric;
  }

  getMetrics(departmentId?: DepartmentId): DepartmentMetric[] {
    if (!departmentId) return [...this.metrics];
    return this.metrics.filter((metric) => metric.departmentId === departmentId);
  }

  clear(): void {
    this.agents = [];
    this.tasks.clear();
    this.events = [];
    this.metrics = [];
  }
}
