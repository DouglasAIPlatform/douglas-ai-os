import { createContext } from "react";
import type { EventMonitor } from "./EventMonitor";
import type { EventMonitorSnapshot, EventTimelineEntry, LiveEvent } from "./MonitorTypes";

export interface EventMonitorContextValue {
  monitor: EventMonitor;
  snapshot: EventMonitorSnapshot;
  timeline: EventTimelineEntry[];
  latestEvent: LiveEvent | null;
}

export const EventMonitorContext = createContext<EventMonitorContextValue | null>(null);
