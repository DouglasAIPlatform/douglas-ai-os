import type { AutomationContextData, AutomationEventType } from "./AutomationTypes";

export interface AutomationEvent {
  id: string;
  type: AutomationEventType;
  automationId?: string;
  runId?: string;
  payload: AutomationContextData;
  createdAt: string;
}

export type AutomationEventListener = (event: AutomationEvent) => void;

export function createAutomationEvent(
  type: AutomationEventType,
  payload: AutomationContextData = {},
  refs: { automationId?: string; runId?: string } = {},
): AutomationEvent {
  return {
    id: `event:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    type,
    automationId: refs.automationId,
    runId: refs.runId,
    payload,
    createdAt: new Date().toISOString(),
  };
}

export class AutomationEventBus {
  private listeners = new Map<AutomationEventType | "*", Set<AutomationEventListener>>();

  on(type: AutomationEventType | "*", listener: AutomationEventListener): () => void {
    const bucket = this.listeners.get(type) ?? new Set<AutomationEventListener>();
    bucket.add(listener);
    this.listeners.set(type, bucket);

    return () => {
      bucket.delete(listener);
    };
  }

  emit(event: AutomationEvent): void {
    this.listeners.get(event.type)?.forEach((listener) => listener(event));
    this.listeners.get("*")?.forEach((listener) => listener(event));
  }

  clear(): void {
    this.listeners.clear();
  }
}
