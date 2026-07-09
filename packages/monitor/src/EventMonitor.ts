import type {
  EventFilterCriteria,
  EventMonitorSnapshot,
  EventTimelineEntry,
  LiveEvent,
} from "./MonitorTypes";
import { EventFilter, EventTimeline } from "./EventTimeline";
import { EventInspector } from "./EventInspector";
import { EventLog } from "./EventLog";
import { EventStream } from "./EventStream";

export interface EventMonitorOptions {
  log?: EventLog;
  stream?: EventStream;
  filter?: EventFilter;
  timeline?: EventTimeline;
  inspector?: EventInspector;
  logCapacity?: number;
}

export class EventMonitor {
  private readonly log: EventLog;
  private readonly stream: EventStream;
  private readonly filter: EventFilter;
  private readonly timeline: EventTimeline;
  private readonly inspector: EventInspector;

  constructor(options: EventMonitorOptions = {}) {
    this.log = options.log ?? new EventLog(options.logCapacity);
    this.stream = options.stream ?? new EventStream();
    this.filter = options.filter ?? new EventFilter();
    this.timeline = options.timeline ?? new EventTimeline();
    this.inspector = options.inspector ?? new EventInspector();
  }

  ingest(event: LiveEvent): void {
    this.log.append(event);
    this.stream.emit(event);
  }

  seed(events: LiveEvent[]): void {
    this.log.appendMany(events);
  }

  setFilter(criteria: EventFilterCriteria): void {
    this.filter.setCriteria(criteria);
  }

  clearFilter(): void {
    this.filter.clear();
  }

  getSnapshot(limit = 50): EventMonitorSnapshot {
    const all = this.log.getAll();
    const filtered = this.filter.apply(all);
    const events = filtered.slice(0, limit);

    return {
      events,
      totalCount: all.length,
      filteredCount: filtered.length,
      lastEventAt: all[0]?.timestamp,
      activeFilter: this.filter.getCriteria(),
    };
  }

  getTimeline(limit = 50): EventTimelineEntry[] {
    const filtered = this.filter.apply(this.log.getAll());
    return this.timeline.build(filtered).slice(0, limit);
  }

  inspect(eventId: string) {
    return this.inspector.inspect(eventId, this.log);
  }

  subscribe(listener: (event: LiveEvent) => void): () => void {
    return this.stream.subscribe(listener);
  }

  getLog(): EventLog {
    return this.log;
  }

  getStream(): EventStream {
    return this.stream;
  }
}

export function createEventMonitor(options?: EventMonitorOptions): EventMonitor {
  return new EventMonitor(options);
}
