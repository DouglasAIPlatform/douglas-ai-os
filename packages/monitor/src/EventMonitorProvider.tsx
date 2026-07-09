"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { EventMonitorContext } from "./EventMonitorContext";
import { createEventMonitor, type EventMonitor } from "./EventMonitor";
import type { LiveEvent } from "./MonitorTypes";

export interface EventMonitorProviderProps {
  children: ReactNode;
  seedEvents?: LiveEvent[];
  monitor?: EventMonitor;
  pollIntervalMs?: number;
  displayLimit?: number;
}

export function EventMonitorProvider({
  children,
  seedEvents = [],
  monitor: externalMonitor,
  pollIntervalMs = 2000,
  displayLimit = 50,
}: EventMonitorProviderProps) {
  const [monitor] = useState(() => externalMonitor ?? createEventMonitor());
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (seedEvents.length > 0) {
      monitor.seed(seedEvents);
      setVersion((current) => current + 1);
    }
  }, [monitor, seedEvents]);

  useEffect(() => {
    return monitor.subscribe(() => {
      setVersion((current) => current + 1);
    });
  }, [monitor]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVersion((current) => current + 1);
    }, pollIntervalMs);
    return () => clearInterval(interval);
  }, [pollIntervalMs]);

  const snapshot = monitor.getSnapshot(displayLimit);
  const timeline = monitor.getTimeline(displayLimit);

  const value = useMemo(
    () => ({
      monitor,
      snapshot,
      timeline,
      latestEvent: snapshot.events[0] ?? null,
    }),
    [monitor, snapshot, timeline, version],
  );

  return (
    <EventMonitorContext.Provider value={value}>{children}</EventMonitorContext.Provider>
  );
}
