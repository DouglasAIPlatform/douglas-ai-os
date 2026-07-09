import type {
  DepartmentDefinition,
  DepartmentFilter,
  DepartmentId,
  DepartmentStatusName,
} from "./DepartmentTypes";
import type { IDepartmentRegistry } from "./interfaces/IDepartmentRegistry";

function matchesFilter(
  department: DepartmentDefinition,
  filter: DepartmentFilter = {},
): boolean {
  if (filter.status && department.status !== filter.status) return false;
  if (filter.tag) {
    const tags = department.metadata?.tags ?? [];
    if (!tags.includes(filter.tag)) return false;
  }
  return true;
}

export class DepartmentRegistry implements IDepartmentRegistry {
  private departments = new Map<DepartmentId, DepartmentDefinition>();

  register(department: DepartmentDefinition): void {
    this.departments.set(department.id, department);
  }

  registerMany(departments: DepartmentDefinition[]): void {
    departments.forEach((department) => this.register(department));
  }

  get(id: DepartmentId): DepartmentDefinition | undefined {
    return this.departments.get(id);
  }

  getAll(filter?: DepartmentFilter): DepartmentDefinition[] {
    return Array.from(this.departments.values()).filter((department) =>
      matchesFilter(department, filter),
    );
  }

  has(id: DepartmentId): boolean {
    return this.departments.has(id);
  }

  updateStatus(
    id: DepartmentId,
    status: DepartmentStatusName,
  ): DepartmentDefinition | undefined {
    const current = this.departments.get(id);
    if (!current) return undefined;

    const updated = { ...current, status };
    this.departments.set(id, updated);
    return updated;
  }

  size(): number {
    return this.departments.size;
  }

  clear(): void {
    this.departments.clear();
  }
}
