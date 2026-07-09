import { createAgentEvent } from "./AgentEvents";
import type { AgentEventRecord } from "./AgentEvents";
import {
  createEmptyAgentMemory,
  readAgentMemory,
  writeAgentMemory,
  type AgentMemoryScope,
  type AgentMemoryState,
  type AgentMemoryWriteInput,
} from "./AgentMemory";
import {
  createAgentTask,
  updateAgentTaskStatus,
  type AgentTaskInput,
  type AgentTaskRecord,
} from "./AgentTask";
import type {
  AgentDefinition,
  AgentInstance,
  AgentPermission,
  AgentStatus,
  InferenceAdapterReference,
} from "./AgentTypes";

export abstract class BaseAgent {
  protected memoryState: AgentMemoryState;
  protected taskRecords: AgentTaskRecord[] = [];
  protected eventRecords: AgentEventRecord[] = [];
  protected currentStatus: AgentStatus;

  constructor(protected readonly definition: AgentDefinition) {
    this.currentStatus = definition.status;
    this.memoryState = createEmptyAgentMemory();
  }

  get id(): string {
    return this.definition.id;
  }

  get name(): string {
    return this.definition.name;
  }

  get department(): string {
    return this.definition.department;
  }

  get description(): string {
    return this.definition.description;
  }

  get status(): AgentStatus {
    return this.currentStatus;
  }

  get priority() {
    return this.definition.priority;
  }

  get permissions(): AgentPermission[] {
    return this.definition.permissions;
  }

  get capabilities() {
    return this.definition.capabilities;
  }

  get metadata() {
    return this.definition.metadata ?? {};
  }

  get memory(): AgentMemoryState {
    return this.memoryState;
  }

  get tasks(): AgentTaskRecord[] {
    return this.taskRecords;
  }

  get events(): AgentEventRecord[] {
    return this.eventRecords;
  }

  hasPermission(permission: AgentPermission): boolean {
    return this.permissions.includes(permission);
  }

  hasCapability(capability: string): boolean {
    return this.capabilities.includes(capability);
  }

  getSnapshot(): AgentInstance {
    return {
      ...this.definition,
      status: this.currentStatus,
      memory: this.memoryState,
      tasks: [...this.taskRecords],
      events: [...this.eventRecords],
    };
  }

  setStatus(status: AgentStatus): void {
    this.currentStatus = status;
    this.recordEvent("agent:status_changed", { status });
  }

  writeMemory(input: AgentMemoryWriteInput): void {
    if (!this.hasPermission("write:memory")) return;

    this.memoryState = writeAgentMemory(this.memoryState, input);
    this.recordEvent("memory:written", {
      kind: input.kind,
      scope: input.scope,
    });
  }

  readMemory(scope?: AgentMemoryScope) {
    if (!this.hasPermission("read:memory")) return [];
    return readAgentMemory(this.memoryState, scope);
  }

  assignTask(input: AgentTaskInput): AgentTaskRecord | null {
    if (!this.hasPermission("execute:task")) return null;

    const task = createAgentTask(input);
    this.taskRecords = [task, ...this.taskRecords];
    this.recordEvent("task:assigned", { taskId: task.id, title: task.title });
    return task;
  }

  completeTask(taskId: string): void {
    this.taskRecords = this.taskRecords.map((task) =>
      task.id === taskId ? updateAgentTaskStatus(task, "completed") : task,
    );
    this.recordEvent("task:completed", { taskId });
  }

  protected recordEvent(
    type: AgentEventRecord["type"],
    payload: AgentEventRecord["payload"] = {},
  ): void {
    const event = createAgentEvent(type, this.id, payload);
    this.eventRecords = [event, ...this.eventRecords].slice(0, 200);
  }

  getInferenceReference(): InferenceAdapterReference | null {
    const adapterId = this.getInferenceAdapterId();
    if (!adapterId) return null;

    return {
      adapterId,
      modelId:
        typeof this.metadata.modelId === "string"
          ? this.metadata.modelId
          : undefined,
      provider:
        typeof this.metadata.provider === "string"
          ? (this.metadata.provider as InferenceAdapterReference["provider"])
          : undefined,
    };
  }

  async activate(): Promise<void> {
    await this.onActivate();
    this.setStatus("active");
    this.recordEvent("agent:activated");
  }

  async deactivate(): Promise<void> {
    await this.onDeactivate();
    this.setStatus("idle");
    this.recordEvent("agent:deactivated");
  }

  protected abstract onActivate(): Promise<void> | void;
  protected abstract onDeactivate(): Promise<void> | void;
  protected abstract getInferenceAdapterId(): string | null;
}

export class GenericAgent extends BaseAgent {
  protected onActivate(): void {}

  protected onDeactivate(): void {}

  protected getInferenceAdapterId(): string | null {
    const adapterId = this.metadata.inferenceAdapterId;
    return typeof adapterId === "string" ? adapterId : null;
  }
}
