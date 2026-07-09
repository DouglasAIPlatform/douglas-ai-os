import type {
  DepartmentAgentRegistration,
  DepartmentEvent,
  DepartmentId,
  DepartmentMetric,
  DepartmentTask,
  DepartmentTaskInput,
  DepartmentTaskStatus,
} from "../DepartmentTypes";

export interface IDepartmentStore {
  registerAgent(
    departmentId: DepartmentId,
    agentId: string,
  ): DepartmentAgentRegistration;
  getAgents(departmentId?: DepartmentId): DepartmentAgentRegistration[];

  addTask(
    departmentId: DepartmentId,
    input: DepartmentTaskInput,
  ): DepartmentTask;
  getTasks(departmentId?: DepartmentId): DepartmentTask[];
  updateTaskStatus(
    taskId: string,
    status: DepartmentTaskStatus,
  ): DepartmentTask | undefined;

  publishEvent(
    departmentId: DepartmentId,
    topic: string,
    payload?: Record<string, string | number | boolean | null>,
  ): DepartmentEvent;
  getEvents(departmentId?: DepartmentId): DepartmentEvent[];

  recordMetric(
    departmentId: DepartmentId,
    key: string,
    label: string,
    value: number,
  ): DepartmentMetric;
  getMetrics(departmentId?: DepartmentId): DepartmentMetric[];
  clear(): void;
}
