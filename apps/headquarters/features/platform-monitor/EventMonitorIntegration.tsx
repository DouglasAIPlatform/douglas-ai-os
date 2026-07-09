"use client";

import { useDemoData, toEventNoisePolicy } from "@douglas/demo-data";
import { EventMonitorProvider, isDemoTickerEnabled, useLiveEventMonitor } from "@douglas/monitor";
import { useEventBus } from "@douglas/events";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import {
  getNextMockLiveEvent,
  mapBusEventToLiveEvent,
  platformMonitorSeedEvents,
} from "@/features/platform-monitor";

interface EventMonitorIntegrationProps {
  children: ReactNode;
}

function EventBusBridge({ children }: { children: ReactNode }) {
  const { subscribeAll } = useEventBus();
  const { monitor } = useLiveEventMonitor();
  const { policy } = useDemoData();
  const noisePolicy = useMemo(() => toEventNoisePolicy(policy), [policy]);

  useEffect(() => {
    return subscribeAll((event) => {
      monitor.ingest(mapBusEventToLiveEvent(event));
    });
  }, [monitor, subscribeAll]);

  useEffect(() => {
    if (!isDemoTickerEnabled(noisePolicy)) return;

    const intervalMs = policy.demoTickerIntervalMs;
    const interval = setInterval(() => {
      monitor.ingest(getNextMockLiveEvent());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [monitor, noisePolicy, policy.demoTickerIntervalMs]);

  return children;
}

function EventMonitorRoot({ children }: { children: ReactNode }) {
  const { isSourceEnabled } = useDemoData();
  const seedEvents = useMemo(
    () => (isSourceEnabled("event_monitor_seeds") ? platformMonitorSeedEvents : []),
    [isSourceEnabled],
  );

  return (
    <EventMonitorProvider seedEvents={seedEvents}>
      <EventBusBridge>{children}</EventBusBridge>
    </EventMonitorProvider>
  );
}

export function EventMonitorIntegration({ children }: EventMonitorIntegrationProps) {
  return <EventMonitorRoot>{children}</EventMonitorRoot>;
}
