import type { LiveEvent } from "./MonitorTypes";

export type EventStreamListener = (event: LiveEvent) => void;

export class EventStream {
  private listeners = new Set<EventStreamListener>();
  private lastEmittedAt: string | null = null;

  emit(event: LiveEvent): void {
    this.lastEmittedAt = event.timestamp;
    this.listeners.forEach((listener) => listener(event));
  }

  subscribe(listener: EventStreamListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getListenerCount(): number {
    return this.listeners.size;
  }

  getLastEmittedAt(): string | null {
    return this.lastEmittedAt;
  }
}
