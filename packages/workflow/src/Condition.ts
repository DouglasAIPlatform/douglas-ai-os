import type { ConditionOperator, WorkflowContextData } from "./WorkflowTypes";

export interface Condition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string | number | boolean;
}

export function evaluateCondition(
  condition: Condition,
  context: WorkflowContextData,
): boolean {
  const actual = context[condition.field];

  switch (condition.operator) {
    case "equals":
      return actual === condition.value;
    case "not_equals":
      return actual !== condition.value;
    case "contains":
      return String(actual ?? "").includes(String(condition.value));
    case "greater_than":
      return Number(actual) > Number(condition.value);
    case "less_than":
      return Number(actual) < Number(condition.value);
    default:
      return false;
  }
}

export function evaluateAllConditions(
  conditions: Condition[],
  context: WorkflowContextData,
): boolean {
  if (!conditions.length) return true;
  return conditions.every((condition) => evaluateCondition(condition, context));
}
