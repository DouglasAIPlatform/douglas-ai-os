import type {
  DepartmentEvent,
  DepartmentEventInput,
  DepartmentHealthReport,
  DepartmentId,
  DepartmentMetric,
  DepartmentMetricInput,
  DepartmentTask,
  DepartmentTaskInput,
} from "./DepartmentTypes";
import type { IDepartmentManager } from "./interfaces/IDepartmentManager";

export class DepartmentContext {
  constructor(
    public readonly departmentId: DepartmentId,
    private readonly manager: IDepartmentManager,
  ) {}

  registerAgent(agentId: string): void {
    this.manager.registerAgent(this.departmentId, agentId);
  }

  receiveTask(input: DepartmentTaskInput): DepartmentTask | undefined {
    return this.manager.receiveTask(this.departmentId, input);
  }

  publishEvent(input: DepartmentEventInput): DepartmentEvent | undefined {
    return this.manager.publishEvent(
      this.departmentId,
      input.topic,
      input.payload,
    );
  }

  emitMetric(input: DepartmentMetricInput): DepartmentMetric | undefined {
    return this.manager.emitMetric(
      this.departmentId,
      input.key,
      input.label,
      input.value,
    );
  }

  reportHealth(): DepartmentHealthReport | undefined {
    return this.manager.reportHealth(this.departmentId);
  }
}
