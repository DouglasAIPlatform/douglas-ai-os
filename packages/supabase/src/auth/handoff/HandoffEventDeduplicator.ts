import type { HandoffEventTopic } from "./HandoffEventKey";
import { buildHandoffEventKey } from "./HandoffEventKey";
import { HandoffEventHistory } from "./HandoffEventHistory";
import {
  classifyHandoffTransition,
  describeHandoffTransition,
  resolveHandoffEventTopics,
  type HandoffRelevantTransition,
} from "./HandoffEventPolicy";
import type { HandoffStateSnapshot } from "./HandoffStateSnapshot";
import { handoffSnapshotsEqual } from "./HandoffStateSnapshot";

export interface HandoffEventDeduplicatorOptions {
  history?: HandoffEventHistory;
}

export interface HandoffEventDedupResult {
  topicsToEmit: HandoffEventTopic[];
  transition: HandoffRelevantTransition | null;
  currentSnapshot: HandoffStateSnapshot;
  skipped: boolean;
  skipReason?: "loading" | "unchanged" | "initial_observation" | "no_relevant_change";
}

/** Evita emissões duplicadas de auth:operator:handoff_* em re-renders. */
export class HandoffEventDeduplicator {
  private lastSnapshot: HandoffStateSnapshot | null = null;
  private readonly history: HandoffEventHistory;

  constructor(options: HandoffEventDeduplicatorOptions = {}) {
    this.history = options.history ?? new HandoffEventHistory();
  }

  getLastRelevantTransition(): HandoffRelevantTransition | null {
    return this.history.getLastRelevantTransition();
  }

  evaluate(
    current: HandoffStateSnapshot,
    options: { authLoading: boolean },
  ): HandoffEventDedupResult {
    if (options.authLoading) {
      return {
        topicsToEmit: [],
        transition: null,
        currentSnapshot: current,
        skipped: true,
        skipReason: "loading",
      };
    }

    if (this.lastSnapshot && handoffSnapshotsEqual(this.lastSnapshot, current)) {
      return {
        topicsToEmit: [],
        transition: null,
        currentSnapshot: current,
        skipped: true,
        skipReason: "unchanged",
      };
    }

    const previous = this.lastSnapshot;

    if (!previous) {
      this.lastSnapshot = current;
      return {
        topicsToEmit: [],
        transition: null,
        currentSnapshot: current,
        skipped: true,
        skipReason: "initial_observation",
      };
    }

    const classified = classifyHandoffTransition(previous, current);
    this.lastSnapshot = current;

    if (!classified) {
      return {
        topicsToEmit: [],
        transition: null,
        currentSnapshot: current,
        skipped: true,
        skipReason: "no_relevant_change",
      };
    }

    const candidateTopics = resolveHandoffEventTopics(classified);
    const topicsToEmit = candidateTopics.filter((topic) => {
      const key = buildHandoffEventKey(
        topic,
        classified.previous,
        classified.current,
        classified.primaryReason,
      );
      return !this.history.has(key);
    });

    for (const topic of topicsToEmit) {
      this.history.record(
        buildHandoffEventKey(
          topic,
          classified.previous,
          classified.current,
          classified.primaryReason,
        ),
      );
    }

    const transition =
      topicsToEmit.length > 0
        ? describeHandoffTransition(classified, topicsToEmit, new Date().toISOString())
        : null;

    if (transition) {
      this.history.setLastRelevantTransition(transition);
    }

    return {
      topicsToEmit,
      transition,
      currentSnapshot: current,
      skipped: topicsToEmit.length === 0,
      skipReason: topicsToEmit.length === 0 ? "unchanged" : undefined,
    };
  }
}

export function createHandoffEventDeduplicator(
  options?: HandoffEventDeduplicatorOptions,
): HandoffEventDeduplicator {
  return new HandoffEventDeduplicator(options);
}
