import type {
  DepartmentDefinition,
  DepartmentFilter,
  DepartmentId,
  DepartmentStatusName,
} from "../DepartmentTypes";

export interface IDepartmentRegistry {
  register(department: DepartmentDefinition): void;
  registerMany(departments: DepartmentDefinition[]): void;
  get(id: DepartmentId): DepartmentDefinition | undefined;
  getAll(filter?: DepartmentFilter): DepartmentDefinition[];
  has(id: DepartmentId): boolean;
  updateStatus(
    id: DepartmentId,
    status: DepartmentStatusName,
  ): DepartmentDefinition | undefined;
  size(): number;
  clear(): void;
}
