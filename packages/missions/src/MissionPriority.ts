import type { MissionPriority } from "./MissionTypes";
import { MISSION_PRIORITY_LABELS, MISSION_PRIORITY_ORDER } from "./MissionTypes";

export type { MissionPriority } from "./MissionTypes";
export { MISSION_PRIORITY_LABELS, MISSION_PRIORITY_ORDER };

export function compareMissionPriority(
  a: MissionPriority,
  b: MissionPriority,
): number {
  return MISSION_PRIORITY_ORDER[a] - MISSION_PRIORITY_ORDER[b];
}
