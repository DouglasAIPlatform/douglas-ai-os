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
} from "../DepartmentTypes";
import type { DepartmentContext } from "../DepartmentContext";
import type { IDepartmentRegistry } from "./IDepartmentRegistry";
import type { IDepartmentStore } from "./IDepartmentStore";

export interface IDepartmentManager {
  registerDepartments(departments: DepartmentDefinition[]): void;
  getDepartment(id: DepartmentId): DepartmentDefinition | undefined;
  getAllDepartments(filter?: DepartmentFilter): DepartmentDefinition[];
  getContext(departmentId: DepartmentId): DepartmentContext | undefined;
  registerAgent(departmentId: DepartmentId, agentId: string): void;
  receiveTask(
    departmentId: DepartmentId,
    input: DepartmentTaskInput,
  ): DepartmentTask | undefined;
  publishEvent(
    departmentId: DepartmentId,
    topic: string,
    payload?: Record<string, string | number | boolean | null>,
  ): DepartmentEvent | undefined;
  emitMetric(
    departmentId: DepartmentId,
    key: string,
    label: string,
    value: number,
  ): DepartmentMetric | undefined;
  reportHealth(departmentId: DepartmentId): DepartmentHealthReport | undefined;
  reportAllHealth(): DepartmentHealthReport[];
  getMetricsSnapshot(departmentId: DepartmentId): DepartmentMetricsSnapshot | undefined;
  getAllMetricsSnapshots(): DepartmentMetricsSnapshot[];
  updateStatus(
    departmentId: DepartmentId,
    status: DepartmentStatusName,
  ): DepartmentDefinition | undefined;
  getRegistry(): IDepartmentRegistry;
  getStore(): IDepartmentStore;
}
