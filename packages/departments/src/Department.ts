import type { DepartmentDefinition } from "./DepartmentTypes";

export class Department {
  constructor(public readonly definition: DepartmentDefinition) {}

  get id() {
    return this.definition.id;
  }

  get name() {
    return this.definition.name;
  }

  get status() {
    return this.definition.status;
  }

  withDefinition(definition: DepartmentDefinition): Department {
    return new Department(definition);
  }
}

export function createDepartment(definition: DepartmentDefinition): Department {
  return new Department(definition);
}
