"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import { EventBus } from "./EventBus";
import { EventContext } from "./EventContext";
import type { EventDefinition } from "./EventRegistry";
import type { EventHandler } from "./EventHandler";
import type { PublishOptions } from "./EventPublisher";
import type {
  EventCategory,
  EventPayload,
  EventSource,
  EventTopic,
} from "./TypedEvents";

export interface EventProviderProps {
  children: ReactNode;
  definitions: EventDefinition[];
}

export function EventProvider({ children, definitions }: EventProviderProps) {
  const bus = useMemo(() => {
    const instance = new EventBus();
    instance.bootstrap(definitions);
    return instance;
  }, [definitions]);

  const publish = useCallback(
    <TTopic extends EventTopic>(
      topic: TTopic,
      source: EventSource,
      payload: EventPayload<TTopic>,
      options?: PublishOptions,
    ) => bus.publish(topic, source, payload, options),
    [bus],
  );

  const subscribe = useCallback(
    <TTopic extends EventTopic>(
      topic: TTopic,
      handler: EventHandler<TTopic>,
    ) => bus.subscribe(topic, handler),
    [bus],
  );

  const subscribeAll = useCallback(
    (handler: EventHandler<EventTopic>) => bus.subscribeAll(handler),
    [bus],
  );

  const subscribeCategory = useCallback(
    (category: EventCategory, handler: EventHandler<EventTopic>) =>
      bus.subscribeCategory(category, handler),
    [bus],
  );

  const getHistory = useCallback(
    <TTopic extends EventTopic>(topic?: TTopic, limit?: number) =>
      bus.getHistory(topic, limit),
    [bus],
  );

  const value = useMemo(
    () => ({
      bus,
      definitions: bus.getRegistry().getAll(),
      publish,
      subscribe,
      subscribeAll,
      subscribeCategory,
      getHistory,
    }),
    [bus, getHistory, publish, subscribe, subscribeAll, subscribeCategory],
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}
