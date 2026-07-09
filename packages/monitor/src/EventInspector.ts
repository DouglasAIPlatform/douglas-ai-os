import type { EventInspection, LiveEvent } from "./MonitorTypes";
import type { EventLog } from "./EventLog";

export class EventInspector {
  inspect(eventId: string, log: EventLog): EventInspection | null {
    const event = log.getById(eventId);
    if (!event) return null;

    const all = log.getAll();

    return {
      event,
      relatedCount: all.filter(
        (entry) => entry.type === event.type || entry.source === event.source,
      ).length,
      sameSourceCount: all.filter((entry) => entry.source === event.source).length,
      sameTypeCount: all.filter((entry) => entry.type === event.type).length,
    };
  }

  summarize(event: LiveEvent): string {
    const metaKeys = Object.keys(event.metadata).slice(0, 2);
    if (metaKeys.length === 0) return event.message;

    const metaSummary = metaKeys
      .map((key) => `${key}=${String(event.metadata[key])}`)
      .join(", ");

    return `${event.message} (${metaSummary})`;
  }
}
