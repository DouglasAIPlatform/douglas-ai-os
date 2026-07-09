import type {
  DepartmentHealthReport,
  DepartmentId,
} from "../DepartmentTypes";
import type { IDepartmentRegistry } from "./IDepartmentRegistry";
import type { IDepartmentStore } from "./IDepartmentStore";

export interface IDepartmentHealthReporter {
  report(
    departmentId: DepartmentId,
    registry: IDepartmentRegistry,
    store: IDepartmentStore,
  ): DepartmentHealthReport;
  reportAll(
    registry: IDepartmentRegistry,
    store: IDepartmentStore,
  ): DepartmentHealthReport[];
}
