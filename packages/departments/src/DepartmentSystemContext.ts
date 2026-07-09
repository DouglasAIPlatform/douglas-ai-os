import { createContext } from "react";
import type { DepartmentManager } from "./DepartmentManager";
import type {
  DepartmentDefinition,
  DepartmentFilter,
  DepartmentHealthReport,
  DepartmentId,
  DepartmentMetricsSnapshot,
} from "./DepartmentTypes";
import type { DepartmentContext } from "./DepartmentContext";

export interface DepartmentSystemContextValue {
  manager: DepartmentManager;
  departments: DepartmentDefinition[];
  healthReports: DepartmentHealthReport[];
  metricsSnapshots: DepartmentMetricsSnapshot[];
  getContext: (departmentId: DepartmentId) => DepartmentContext | undefined;
  getHealth: (departmentId: DepartmentId) => DepartmentHealthReport | undefined;
}

export const DepartmentSystemContext =
  createContext<DepartmentSystemContextValue | null>(null);

export type { DepartmentFilter };
