import type { CoreEvent, CoreEventPayload, CoreModuleId } from "./CoreTypes";

export type CoreEventHandler = (event: CoreEvent) => void;

export function createCoreEvent(
  topic: string,
  source: CoreEvent["source"],
  payload: CoreEventPayload = {},
): CoreEvent {
  return {
    id: `core-event:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    topic,
    source,
    payload,
    createdAt: new Date().toISOString(),
  };
}

export class EventBus {
  private handlers = new Map<string | "*", Set<CoreEventHandler>>();
  private history: CoreEvent[] = [];
  private readonly historyCapacity: number;

  constructor(historyCapacity = 300) {
    this.historyCapacity = historyCapacity;
  }

  publish(
    topic: string,
    source: CoreModuleId | "core",
    payload: CoreEventPayload = {},
  ): CoreEvent {
    const event = createCoreEvent(topic, source, payload);
    this.record(event);

    this.handlers.get(topic)?.forEach((handler) => handler(event));
    this.handlers.get("*")?.forEach((handler) => handler(event));

    return event;
  }

  subscribe(topic: string | "*", handler: CoreEventHandler): () => void {
    const bucket = this.handlers.get(topic) ?? new Set<CoreEventHandler>();
    bucket.add(handler);
    this.handlers.set(topic, bucket);

    return () => {
      bucket.delete(handler);
    };
  }

  getHistory(topic?: string, limit = 50): CoreEvent[] {
    const events = topic
      ? this.history.filter((event) => event.topic === topic)
      : this.history;

    return events.slice(0, limit);
  }

  clear(): void {
    this.handlers.clear();
    this.history = [];
  }

  private record(event: CoreEvent): void {
    this.history = [event, ...this.history].slice(0, this.historyCapacity);
  }
}
