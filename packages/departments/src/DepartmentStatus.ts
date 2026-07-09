import type { DepartmentId, DepartmentStatusName } from "./DepartmentTypes";

export class DepartmentStatus {
  private statuses = new Map<DepartmentId, DepartmentStatusName>();

  set(departmentId: DepartmentId, status: DepartmentStatusName): void {
    this.statuses.set(departmentId, status);
  }

  get(departmentId: DepartmentId): DepartmentStatusName | undefined {
    return this.statuses.get(departmentId);
  }

  getAll(): Map<DepartmentId, DepartmentStatusName> {
    return new Map(this.statuses);
  }

  clear(): void {
    this.statuses.clear();
  }
}
