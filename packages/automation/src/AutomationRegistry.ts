import type { AutomationDefinition, AutomationFilter } from "./AutomationTypes";
import { matchesInternalEvent } from "./AutomationTrigger";

export class AutomationRegistry {
  private automations = new Map<string, AutomationDefinition>();

  register(automation: AutomationDefinition): void {
    this.automations.set(automation.id, automation);
  }

  registerMany(automations: AutomationDefinition[]): void {
    automations.forEach((automation) => this.register(automation));
  }

  unregister(automationId: string): boolean {
    return this.automations.delete(automationId);
  }

  get(automationId: string): AutomationDefinition | undefined {
    return this.automations.get(automationId);
  }

  has(automationId: string): boolean {
    return this.automations.has(automationId);
  }

  getAll(): AutomationDefinition[] {
    return Array.from(this.automations.values());
  }

  filter(criteria: AutomationFilter = {}): AutomationDefinition[] {
    return this.getAll().filter((automation) => {
      if (criteria.status && automation.status !== criteria.status) {
        return false;
      }

      if (
        criteria.triggerType &&
        automation.trigger.type !== criteria.triggerType
      ) {
        return false;
      }

      if (
        criteria.department &&
        automation.metadata.department !== criteria.department
      ) {
        return false;
      }

      if (criteria.tag && !automation.metadata.tags?.includes(criteria.tag)) {
        return false;
      }

      return true;
    });
  }

  findByInternalEvent(eventName: string): AutomationDefinition[] {
    return this.getAll().filter(
      (automation) =>
        automation.status === "active" &&
        matchesInternalEvent(automation.trigger, eventName),
    );
  }

  size(): number {
    return this.automations.size;
  }

  clear(): void {
    this.automations.clear();
  }
}
