import type {
  DepartmentId,
  DepartmentMetric,
  DepartmentMetricsSnapshot,
} from "./DepartmentTypes";
import type { IDepartmentMetrics } from "./interfaces/IDepartmentMetrics";
import type { IDepartmentStore } from "./interfaces/IDepartmentStore";

export class DepartmentMetrics implements IDepartmentMetrics {
  constructor(private readonly store: IDepartmentStore) {}

  record(
    departmentId: DepartmentId,
    key: string,
    label: string,
    value: number,
  ): DepartmentMetric {
    return this.store.recordMetric(departmentId, key, label, value);
  }

  getByDepartment(departmentId: DepartmentId): DepartmentMetric[] {
    return this.store.getMetrics(departmentId);
  }

  snapshot(departmentId: DepartmentId): DepartmentMetricsSnapshot {
    const metrics = this.store.getMetrics(departmentId);
    const tasks = this.store.getTasks(departmentId);
    const agents = this.store.getAgents(departmentId);

    const completed = tasks.filter((task) => task.status === "completed").length;
    const taskCompletionRate = tasks.length ? (completed / tasks.length) * 100 : 0;
    const averageTasksPerAgent = agents.length ? tasks.length / agents.length : tasks.length;

    return {
      departmentId,
      metrics,
      taskCompletionRate: Math.round(taskCompletionRate * 10) / 10,
      averageTasksPerAgent: Math.round(averageTasksPerAgent * 10) / 10,
    };
  }

  snapshotAll(): DepartmentMetricsSnapshot[] {
    const departmentIds = new Set<DepartmentId>([
      ...this.store.getAgents().map((entry) => entry.departmentId),
      ...this.store.getTasks().map((task) => task.departmentId),
      ...this.store.getMetrics().map((metric) => metric.departmentId),
    ]);

    return Array.from(departmentIds).map((departmentId) =>
      this.snapshot(departmentId),
    );
  }
}
