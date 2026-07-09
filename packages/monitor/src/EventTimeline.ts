import type { EventFilterCriteria, EventTimelineEntry, LiveEvent } from "./MonitorTypes";

export class EventFilter {
  private criteria: EventFilterCriteria = {};

  setCriteria(criteria: EventFilterCriteria): void {
    this.criteria = { ...criteria };
  }

  getCriteria(): EventFilterCriteria {
    return { ...this.criteria };
  }

  clear(): void {
    this.criteria = {};
  }

  apply(events: LiveEvent[]): LiveEvent[] {
    return events.filter((event) => this.matches(event));
  }

  matches(event: LiveEvent): boolean {
    if (this.criteria.excludeDemo && event.demo === true) {
      return false;
    }

    if (this.criteria.source && event.source !== this.criteria.source) {
      return false;
    }

    if (this.criteria.severity && event.severity !== this.criteria.severity) {
      return false;
    }

    if (this.criteria.type && event.type !== this.criteria.type) {
      return false;
    }

    if (this.criteria.periodStart && event.timestamp < this.criteria.periodStart) {
      return false;
    }

    if (this.criteria.periodEnd && event.timestamp > this.criteria.periodEnd) {
      return false;
    }

    return true;
  }
}

export class EventTimeline {
  build(events: LiveEvent[]): EventTimelineEntry[] {
    const sorted = [...events].sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    );

    return sorted.map((event, index) => ({
      event,
      index,
    }));
  }
}
