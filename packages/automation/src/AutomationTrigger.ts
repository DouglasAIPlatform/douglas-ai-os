import type { AutomationTriggerType } from "./AutomationTypes";

export interface AutomationTrigger {
  id: string;
  type: AutomationTriggerType;
  label: string;
  config: Record<string, string | number | boolean>;
  enabled: boolean;
}

export function createAutomationTrigger(
  input: Omit<AutomationTrigger, "enabled"> & { enabled?: boolean },
): AutomationTrigger {
  return {
    ...input,
    enabled: input.enabled ?? true,
  };
}

export function isAutomationTriggerEnabled(trigger: AutomationTrigger): boolean {
  return trigger.enabled;
}

export function matchesInternalEvent(
  trigger: AutomationTrigger,
  eventName: string,
): boolean {
  if (trigger.type !== "internal_event") return false;
  return trigger.config.event === eventName;
}
