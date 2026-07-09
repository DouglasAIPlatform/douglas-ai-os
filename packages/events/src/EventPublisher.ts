import { createEvent, type Event, type EventMetadata } from "./Event";
import type { EventSubscriber } from "./EventSubscriber";
import type {
  EventPayload,
  EventSource,
  EventTopic,
} from "./TypedEvents";

export interface PublishOptions {
  metadata?: EventMetadata;
}

export class EventPublisher {
  constructor(private readonly subscriber: EventSubscriber) {}

  publish<TTopic extends EventTopic>(
    topic: TTopic,
    source: EventSource,
    payload: EventPayload<TTopic>,
    options: PublishOptions = {},
  ): Event<TTopic> {
    const event = createEvent(topic, source, payload, options.metadata ?? {});
    this.subscriber.dispatch(event);
    return event;
  }
}
