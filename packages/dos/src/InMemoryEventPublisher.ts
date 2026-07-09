import type { LifecycleEvent } from "./interfaces/IEventPublisher";
import type { IEventPublisher } from "./interfaces/IEventPublisher";

export class InMemoryEventPublisher implements IEventPublisher {
  private history: LifecycleEvent[] = [];
  private readonly capacity: number;

  constructor(capacity = 200) {
    this.capacity = capacity;
  }

  publish(
    topic: string,
    payload: Record<string, string | number | boolean | null> = {},
  ): LifecycleEvent {
    const event: LifecycleEvent = {
      topic,
      payload,
      timestamp: new Date().toISOString(),
    };

    this.history = [event, ...this.history].slice(0, this.capacity);
    return event;
  }

  getHistory(): LifecycleEvent[] {
    return [...this.history];
  }

  clear(): void {
    this.history = [];
  }
}
