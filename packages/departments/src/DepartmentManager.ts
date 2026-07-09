import { DepartmentContext } from "./DepartmentContext";
import { DefaultDepartmentHealthReporter } from "./DefaultDepartmentHealthReporter";
import { DepartmentMetrics } from "./DepartmentMetrics";
import { DepartmentRegistry } from "./DepartmentRegistry";
import { InMemoryDepartmentStore } from "./InMemoryDepartmentStore";
import type {
  DepartmentDefinition,
  DepartmentEvent,
  DepartmentFilter,
  DepartmentHealthReport,
  DepartmentId,
  DepartmentMetric,
  DepartmentMetricsSnapshot,
  DepartmentStatusName,
  DepartmentTask,
  DepartmentTaskInput,
} from "./DepartmentTypes";
import type { IDepartmentHealthReporter } from "./interfaces/IDepartmentHealthReporter";
import type { IDepartmentManager } from "./interfaces/IDepartmentManager";
import type { IDepartmentMetrics } from "./interfaces/IDepartmentMetrics";
import type { IDepartmentRegistry } from "./interfaces/IDepartmentRegistry";
import type { IDepartmentStore } from "./interfaces/IDepartmentStore";

export interface DepartmentManagerOptions {
  registry?: IDepartmentRegistry;
  store?: IDepartmentStore;
  metrics?: IDepartmentMetrics;
  healthReporter?: IDepartmentHealthReporter;
}

export class DepartmentManager implements IDepartmentManager {
  private readonly registry: IDepartmentRegistry;
  private readonly store: IDepartmentStore;
  private readonly metrics: IDepartmentMetrics;
  private readonly healthReporter: IDepartmentHealthReporter;

  constructor(options: DepartmentManagerOptions = {}) {
    this.registry = options.registry ?? new DepartmentRegistry();
    this.store = options.store ?? new InMemoryDepartmentStore();
    this.metrics =
      options.metrics ?? new DepartmentMetrics(this.store);
    this.healthReporter =
      options.healthReporter ?? new DefaultDepartmentHealthReporter();
  }

  registerDepartments(departments: DepartmentDefinition[]): void {
    this.registry.registerMany(departments);
  }

  getDepartment(id: DepartmentId): DepartmentDefinition | undefined {
    return this.registry.get(id);
  }

  getAllDepartments(filter?: DepartmentFilter): DepartmentDefinition[] {
    return this.registry.getAll(filter);
  }

  getContext(departmentId: DepartmentId): DepartmentContext | undefined {
    if (!this.registry.has(departmentId)) return undefined;
    return new DepartmentContext(departmentId, this);
  }

  registerAgent(departmentId: DepartmentId, agentId: string): void {
    if (!this.registry.has(departmentId)) return;
    this.store.registerAgent(departmentId, agentId);
  }

  receiveTask(
    departmentId: DepartmentId,
    input: DepartmentTaskInput,
  ): DepartmentTask | undefined {
    if (!this.registry.has(departmentId)) return undefined;

    const task = this.store.addTask(departmentId, input);
    this.registry.updateStatus(departmentId, "busy");
    return task;
  }

  publishEvent(
    departmentId: DepartmentId,
    topic: string,
    payload?: Record<string, string | number | boolean | null>,
  ): DepartmentEvent | undefined {
    if (!this.registry.has(departmentId)) return undefined;
    return this.store.publishEvent(departmentId, topic, payload);
  }

  emitMetric(
    departmentId: DepartmentId,
    key: string,
    label: string,
    value: number,
  ): DepartmentMetric | undefined {
    if (!this.registry.has(departmentId)) return undefined;
    return this.metrics.record(departmentId, key, label, value);
  }

  reportHealth(departmentId: DepartmentId): DepartmentHealthReport | undefined {
    if (!this.registry.has(departmentId)) return undefined;
    return this.healthReporter.report(departmentId, this.registry, this.store);
  }

  reportAllHealth(): DepartmentHealthReport[] {
    return this.healthReporter.reportAll(this.registry, this.store);
  }

  getMetricsSnapshot(
    departmentId: DepartmentId,
  ): DepartmentMetricsSnapshot | undefined {
    if (!this.registry.has(departmentId)) return undefined;
    return this.metrics.snapshot(departmentId);
  }

  getAllMetricsSnapshots(): DepartmentMetricsSnapshot[] {
    return this.metrics.snapshotAll();
  }

  updateStatus(
    departmentId: DepartmentId,
    status: DepartmentStatusName,
  ): DepartmentDefinition | undefined {
    return this.registry.updateStatus(departmentId, status);
  }

  getRegistry(): IDepartmentRegistry {
    return this.registry;
  }

  getStore(): IDepartmentStore {
    return this.store;
  }
}
