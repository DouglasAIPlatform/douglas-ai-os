import type { Workflow } from "./Workflow";
import type { WorkflowFilter } from "./WorkflowTypes";

export class WorkflowRegistry {
  private workflows = new Map<string, Workflow>();

  register(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  registerMany(workflows: Workflow[]): void {
    workflows.forEach((workflow) => this.register(workflow));
  }

  unregister(workflowId: string): boolean {
    return this.workflows.delete(workflowId);
  }

  get(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  has(workflowId: string): boolean {
    return this.workflows.has(workflowId);
  }

  getAll(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  filter(criteria: WorkflowFilter = {}): Workflow[] {
    return this.getAll().filter((workflow) => {
      if (criteria.department && workflow.department !== criteria.department) {
        return false;
      }

      if (criteria.status && workflow.status !== criteria.status) {
        return false;
      }

      if (criteria.tag && !workflow.metadata.tags?.includes(criteria.tag)) {
        return false;
      }

      return true;
    });
  }

  getByDepartment(department: string): Workflow[] {
    return this.filter({ department });
  }

  size(): number {
    return this.workflows.size;
  }

  clear(): void {
    this.workflows.clear();
  }
}
