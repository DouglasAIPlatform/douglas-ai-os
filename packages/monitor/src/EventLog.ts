import type { LiveEvent } from "./MonitorTypes";

const DEFAULT_CAPACITY = 500;

export class EventLog {
  private entries: LiveEvent[] = [];

  constructor(private readonly capacity = DEFAULT_CAPACITY) {}

  append(event: LiveEvent): void {
    this.entries = [event, ...this.entries].slice(0, this.capacity);
  }

  appendMany(events: LiveEvent[]): void {
    events.forEach((event) => this.append(event));
  }

  getAll(): LiveEvent[] {
    return [...this.entries];
  }

  getLatest(limit = 50): LiveEvent[] {
    return this.entries.slice(0, limit);
  }

  getById(id: string): LiveEvent | undefined {
    return this.entries.find((event) => event.id === id);
  }

  count(): number {
    return this.entries.length;
  }

  clear(): void {
    this.entries = [];
  }
}
