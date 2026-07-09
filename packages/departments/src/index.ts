export type {
  DepartmentId,
  DepartmentStatusName,
  DepartmentHealthStatus,
  DepartmentTaskStatus,
  DepartmentDefinition,
  DepartmentAgentRegistration,
  DepartmentTask,
  DepartmentTaskInput,
  DepartmentEvent,
  DepartmentEventInput,
  DepartmentMetric,
  DepartmentMetricInput,
  DepartmentHealthReport,
  DepartmentMetricsSnapshot,
  DepartmentMetadata,
  DepartmentFilter,
} from "./DepartmentTypes";

export {
  DEPARTMENT_LABELS,
  DEPARTMENT_STATUS_LABELS,
  DEPARTMENT_HEALTH_LABELS,
} from "./DepartmentTypes";

export type {
  IDepartmentRegistry,
  IDepartmentStore,
  IDepartmentMetrics,
  IDepartmentHealthReporter,
  IDepartmentManager,
} from "./interfaces";

export { DepartmentRegistry } from "./DepartmentRegistry";
export { InMemoryDepartmentStore } from "./InMemoryDepartmentStore";
export { Department, createDepartment } from "./Department";
export { DepartmentContext } from "./DepartmentContext";
export { DepartmentMetrics } from "./DepartmentMetrics";
export { DepartmentStatus } from "./DepartmentStatus";
export { DefaultDepartmentHealthReporter } from "./DefaultDepartmentHealthReporter";
export {
  DepartmentManager,
  type DepartmentManagerOptions,
} from "./DepartmentManager";

export {
  DepartmentSystemContext,
  type DepartmentSystemContextValue,
} from "./DepartmentSystemContext";

export {
  DepartmentProvider,
  type DepartmentProviderProps,
} from "./DepartmentProvider";

export type { DepartmentSeedData } from "./DepartmentSeedTypes";
export { useDepartments } from "./useDepartments";
export { DepartmentPanel } from "./DepartmentPanel";
