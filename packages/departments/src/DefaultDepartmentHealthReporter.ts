import type {
  DepartmentHealthReport,
  DepartmentHealthStatus,
  DepartmentId,
  DepartmentStatusName,
} from "./DepartmentTypes";
import type { IDepartmentHealthReporter } from "./interfaces/IDepartmentHealthReporter";
import type { IDepartmentRegistry } from "./interfaces/IDepartmentRegistry";
import type { IDepartmentStore } from "./interfaces/IDepartmentStore";

function mapHealth(
  status: DepartmentStatusName,
  pendingTasks: number,
  agentCount: number,
): DepartmentHealthStatus {
  if (status === "offline" || agentCount === 0) return "unhealthy";
  if (status === "degraded" || pendingTasks > 10) return "degraded";
  return "healthy";
}

export class DefaultDepartmentHealthReporter implements IDepartmentHealthReporter {
  report(
    departmentId: DepartmentId,
    registry: IDepartmentRegistry,
    store: IDepartmentStore,
  ): DepartmentHealthReport {
    const department = registry.get(departmentId);
    const tasks = store.getTasks(departmentId);
    const agents = store.getAgents(departmentId);
    const pendingTasks = tasks.filter((task) => task.status === "pending").length;
    const activeTasks = tasks.filter((task) => task.status === "in_progress").length;
    const status = department?.status ?? "offline";
    const health = mapHealth(status, pendingTasks, agents.length);

    return {
      departmentId,
      status: health,
      message: department
        ? `Departamento ${department.name} — ${health}.`
        : `Departamento ${departmentId} não encontrado.`,
      checkedAt: new Date().toISOString(),
      agentCount: agents.length,
      taskCount: tasks.length,
      activeTasks,
      pendingTasks,
    };
  }

  reportAll(
    registry: IDepartmentRegistry,
    store: IDepartmentStore,
  ): DepartmentHealthReport[] {
    return registry.getAll().map((department) =>
      this.report(department.id, registry, store),
    );
  }
}
