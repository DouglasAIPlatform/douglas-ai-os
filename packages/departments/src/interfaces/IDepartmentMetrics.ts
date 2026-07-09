import type {
  DepartmentId,
  DepartmentMetric,
  DepartmentMetricsSnapshot,
} from "../DepartmentTypes";

export interface IDepartmentMetrics {
  record(
    departmentId: DepartmentId,
    key: string,
    label: string,
    value: number,
  ): DepartmentMetric;
  getByDepartment(departmentId: DepartmentId): DepartmentMetric[];
  snapshot(departmentId: DepartmentId): DepartmentMetricsSnapshot;
  snapshotAll(): DepartmentMetricsSnapshot[];
}
