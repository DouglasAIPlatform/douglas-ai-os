import type { TriggerType } from "./WorkflowTypes";

export interface Trigger {
  id: string;
  type: TriggerType;
  label: string;
  config: Record<string, string | number | boolean>;
  enabled: boolean;
}

export function createTrigger(
  input: Omit<Trigger, "enabled"> & { enabled?: boolean },
): Trigger {
  return {
    ...input,
    enabled: input.enabled ?? true,
  };
}

export function isTriggerEnabled(trigger: Trigger): boolean {
  return trigger.enabled;
}
