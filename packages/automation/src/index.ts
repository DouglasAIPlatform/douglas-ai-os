export type {
  AutomationActionType,
  AutomationContextData,
  AutomationDefinition,
  AutomationFilter,
  AutomationMetadata,
  AutomationRunFilter,
  AutomationRunStatus,
  AutomationStatus,
  AutomationTriggerType,
  AutomationEventType,
} from "./AutomationTypes";

export {
  AUTOMATION_TRIGGER_LABELS,
  AUTOMATION_TRIGGER_TYPES,
} from "./AutomationTypes";

export {
  createAutomationTrigger,
  isAutomationTriggerEnabled,
  matchesInternalEvent,
  type AutomationTrigger,
} from "./AutomationTrigger";

export {
  AutomationEventBus,
  createAutomationEvent,
  type AutomationEvent,
  type AutomationEventListener,
} from "./AutomationEvent";

export {
  createAutomationAction,
  simulateAutomationAction,
  type AutomationAction,
  type AutomationActionResult,
} from "./AutomationAction";

export {
  AutomationHistory,
  createAutomationRun,
  updateAutomationRunStatus,
  type AutomationHistoryEntry,
  type AutomationRunRecord,
} from "./AutomationHistory";

export {
  AutomationScheduler,
  type ScheduledAutomationJob,
  type ScheduleInput,
} from "./AutomationScheduler";

export { AutomationRegistry } from "./AutomationRegistry";

export {
  AutomationRunner,
  type DispatchInternalEventInput,
  type RunAutomationInput,
} from "./AutomationRunner";

export {
  AutomationContext,
  type AutomationContextValue,
} from "./AutomationContext";

export {
  AutomationProvider,
  type AutomationProviderProps,
} from "./AutomationProvider";

export { useAutomationEngine } from "./useAutomationEngine";
