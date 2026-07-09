import type { ActionType } from "./WorkflowTypes";
import type { Condition } from "./Condition";

export interface Action {
  id: string;
  type: ActionType;
  label: string;
  config: Record<string, string | number | boolean>;
  conditions: Condition[];
}

export interface ActionResult {
  actionId: string;
  type: ActionType;
  status: "skipped" | "simulated" | "failed";
  message: string;
  executedAt: string;
}

export function createAction(
  input: Omit<Action, "conditions"> & { conditions?: Condition[] },
): Action {
  return {
    ...input,
    conditions: input.conditions ?? [],
  };
}

export function simulateAction(action: Action): ActionResult {
  return {
    actionId: action.id,
    type: action.type,
    status: "simulated",
    message: `Action "${action.label}" simulated — no real automation.`,
    executedAt: new Date().toISOString(),
  };
}
