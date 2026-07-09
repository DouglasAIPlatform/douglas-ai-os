import type { AutomationActionType } from "./AutomationTypes";

export interface AutomationAction {
  id: string;
  type: AutomationActionType;
  label: string;
  config: Record<string, string | number | boolean>;
  order: number;
}

export interface AutomationActionResult {
  actionId: string;
  type: AutomationActionType;
  status: "simulated" | "skipped" | "failed";
  message: string;
  executedAt: string;
}

export function createAutomationAction(
  input: Omit<AutomationAction, "order"> & { order?: number },
): AutomationAction {
  return {
    ...input,
    order: input.order ?? 0,
  };
}

export function simulateAutomationAction(action: AutomationAction): AutomationActionResult {
  return {
    actionId: action.id,
    type: action.type,
    status: "simulated",
    message: `Action "${action.label}" simulated — no functional automation.`,
    executedAt: new Date().toISOString(),
  };
}
