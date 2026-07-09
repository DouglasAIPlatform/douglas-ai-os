"use client";

import { createContext } from "react";
import type { Event } from "./Event";
import type { EventBus } from "./EventBus";
import type { EventDefinition } from "./EventRegistry";
import type { EventHandler } from "./EventHandler";
import type { PublishOptions } from "./EventPublisher";
import type {
  EventCategory,
  EventPayload,
  EventSource,
  EventTopic,
} from "./TypedEvents";

export interface EventContextValue {
  bus: EventBus;
  definitions: EventDefinition[];
  publish: <TTopic extends EventTopic>(
    topic: TTopic,
    source: EventSource,
    payload: EventPayload<TTopic>,
    options?: PublishOptions,
  ) => Event<TTopic>;
  subscribe: <TTopic extends EventTopic>(
    topic: TTopic,
    handler: EventHandler<TTopic>,
  ) => () => void;
  subscribeAll: (handler: EventHandler<EventTopic>) => () => void;
  subscribeCategory: (
    category: EventCategory,
    handler: EventHandler<EventTopic>,
  ) => () => void;
  getHistory: <TTopic extends EventTopic>(
    topic?: TTopic,
    limit?: number,
  ) => Event<TTopic>[];
}

export const EventContext = createContext<EventContextValue | null>(null);
