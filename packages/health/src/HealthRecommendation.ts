import type { HealthRecommendation } from "./HealthTypes";

let recommendationCounter = 0;

export function createHealthRecommendation(
  moduleId: string,
  priority: HealthRecommendation["priority"],
  message: string,
): HealthRecommendation {
  recommendationCounter += 1;
  return {
    id: `rec-${moduleId}-${recommendationCounter}`,
    priority,
    message,
    moduleId,
  };
}

export function sortRecommendationsByPriority(
  recommendations: HealthRecommendation[],
): HealthRecommendation[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return [...recommendations].sort(
    (left, right) => priorityOrder[left.priority] - priorityOrder[right.priority],
  );
}
