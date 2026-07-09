import type {
  EventCategory,
  EventPayload,
  EventSource,
  EventTopic,
} from "./TypedEvents";
import { TOPIC_CATEGORY } from "./TypedEvents";

export interface EventMetadata {
  correlationId?: string;
  causationId?: string;
  version?: number;
}

export interface Event<TTopic extends EventTopic = EventTopic> {
  id: string;
  topic: TTopic;
  category: EventCategory;
  source: EventSource;
  payload: EventPayload<TTopic>;
  metadata: EventMetadata;
  createdAt: string;
}

export function createEvent<TTopic extends EventTopic>(
  topic: TTopic,
  source: EventSource,
  payload: EventPayload<TTopic>,
  metadata: EventMetadata = {},
): Event<TTopic> {
  return {
    id: `evt:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    topic,
    category: TOPIC_CATEGORY[topic],
    source,
    payload,
    metadata,
    createdAt: new Date().toISOString(),
  };
}

export function isEventOfTopic<TTopic extends EventTopic>(
  event: Event,
  topic: TTopic,
): event is Event<TTopic> {
  return event.topic === topic;
}

export function isEventOfCategory(
  event: Event,
  category: EventCategory,
): boolean {
  return event.category === category;
}
