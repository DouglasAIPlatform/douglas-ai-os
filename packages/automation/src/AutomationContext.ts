"use client";

import { createContext } from "react";
import type { AutomationEventBus } from "./AutomationEvent";
import type { AutomationHistory } from "./AutomationHistory";
import type { AutomationHistoryEntry } from "./AutomationHistory";
import type { AutomationRunRecord } from "./AutomationHistory";
import type { AutomationRegistry } from "./AutomationRegistry";
import type { AutomationScheduler } from "./AutomationScheduler";
import type { ScheduledAutomationJob } from "./AutomationScheduler";
import type {
  AutomationRunner,
  DispatchInternalEventInput,
  RunAutomationInput,
} from "./AutomationRunner";
import type {
  AutomationDefinition,
  AutomationFilter,
  AutomationRunFilter,
} from "./AutomationTypes";

export interface AutomationContextValue {
  runner: AutomationRunner;
  registry: AutomationRegistry;
  scheduler: AutomationScheduler;
  history: AutomationHistory;
  eventBus: AutomationEventBus;
  automations: AutomationDefinition[];
  runs: AutomationRunRecord[];
  scheduledJobs: ScheduledAutomationJob[];
  activeAutomationId: string | null;
  activeAutomation: AutomationDefinition | null;
  selectAutomation: (automationId: string) => void;
  clearAutomationSelection: () => void;
  listAutomations: (filter?: AutomationFilter) => AutomationDefinition[];
  listRuns: (filter?: AutomationRunFilter) => AutomationRunRecord[];
  runAutomation: (input: RunAutomationInput) => AutomationRunRecord | null;
  processScheduled: () => AutomationRunRecord[];
  dispatchInternalEvent: (input: DispatchInternalEventInput) => AutomationRunRecord[];
  getRecentHistory: (limit?: number) => AutomationHistoryEntry[];
}

export const AutomationContext = createContext<AutomationContextValue | null>(
  null,
);
