import type { AgentDefinition, AgentRegistryFilter } from "./AgentTypes";

export class AgentRegistry {
  private readonly definitions = new Map<string, AgentDefinition>();

  register(definition: AgentDefinition): void {
    if (!definition.id) {
      throw new Error("Agent definition requires a valid id.");
    }

    this.definitions.set(definition.id, definition);
  }

  registerMany(definitions: AgentDefinition[]): void {
    definitions.forEach((definition) => this.register(definition));
  }

  unregister(agentId: string): boolean {
    return this.definitions.delete(agentId);
  }

  get(agentId: string): AgentDefinition | undefined {
    return this.definitions.get(agentId);
  }

  has(agentId: string): boolean {
    return this.definitions.has(agentId);
  }

  getAll(): AgentDefinition[] {
    return Array.from(this.definitions.values());
  }

  filter(criteria: AgentRegistryFilter = {}): AgentDefinition[] {
    return this.getAll().filter((definition) => {
      if (criteria.department && definition.department !== criteria.department) {
        return false;
      }

      if (criteria.status && definition.status !== criteria.status) {
        return false;
      }

      if (criteria.priority && definition.priority !== criteria.priority) {
        return false;
      }

      if (
        criteria.capability &&
        !definition.capabilities.includes(criteria.capability)
      ) {
        return false;
      }

      if (
        criteria.permission &&
        !definition.permissions.includes(criteria.permission)
      ) {
        return false;
      }

      return true;
    });
  }

  getByDepartment(department: string): AgentDefinition[] {
    return this.filter({ department });
  }

  size(): number {
    return this.definitions.size;
  }

  clear(): void {
    this.definitions.clear();
  }
}
