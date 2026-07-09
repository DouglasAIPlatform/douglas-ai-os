import type {
  DepartmentEventInput,
  DepartmentId,
  DepartmentMetricInput,
  DepartmentTaskInput,
} from "./DepartmentTypes";

export interface DepartmentSeedData {
  agentRegistrations?: Array<{ departmentId: DepartmentId; agentId: string }>;
  tasks?: Array<{ departmentId: DepartmentId; task: DepartmentTaskInput }>;
  events?: Array<{ departmentId: DepartmentId; topic: string; payload?: DepartmentEventInput["payload"] }>;
  metrics?: Array<{ departmentId: DepartmentId; key: string; label: string; value: number }>;
}
