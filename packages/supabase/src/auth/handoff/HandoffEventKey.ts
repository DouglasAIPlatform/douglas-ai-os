import type { HandoffStateSnapshot } from "./HandoffStateSnapshot";
import { handoffSnapshotFingerprint } from "./HandoffStateSnapshot";

/** Tópicos auth:operator:handoff_* — alinhados com @douglas/events. */
export const HANDOFF_EVENT_TOPICS = [
  "auth:operator:handoff_started",
  "auth:operator:handoff_completed",
  "auth:operator:handoff_fallback",
  "auth:operator:handoff_failed",
] as const;

export type HandoffEventTopic = (typeof HANDOFF_EVENT_TOPICS)[number];

/** Chave estável para deduplicar emissões de eventos de handoff. */
export type HandoffEventKey = string;

export function buildHandoffEventKey(
  topic: HandoffEventTopic,
  previous: HandoffStateSnapshot,
  current: HandoffStateSnapshot,
  reason: string,
): HandoffEventKey {
  return `${topic}|${handoffSnapshotFingerprint(previous)}->${handoffSnapshotFingerprint(current)}|${reason}`;
}
