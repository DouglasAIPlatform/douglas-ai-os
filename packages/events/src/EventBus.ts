import type { Event } from "./Event";
import { EventPublisher } from "./EventPublisher";
import { EventRegistry } from "./EventRegistry";
import type { EventHandler } from "./EventHandler";
import { EventSubscriber } from "./EventSubscriber";
import type {
  EventCategory,
  EventPayload,
  EventSource,
  EventTopic,
} from "./TypedEvents";
import type { PublishOptions } from "./EventPublisher";

export class EventBus {
  private readonly subscriber: EventSubscriber;
  private readonly publisher: EventPublisher;
  private readonly registry: EventRegistry;
  private history: Event[] = [];
  private readonly historyCapacity: number;

  constructor(historyCapacity = 500) {
    this.subscriber = new EventSubscriber();
    this.publisher = new EventPublisher(this.subscriber);
    this.registry = new EventRegistry();
    this.historyCapacity = historyCapacity;
  }

  getRegistry(): EventRegistry {
    return this.registry;
  }

  getPublisher(): EventPublisher {
    return this.publisher;
  }

  getSubscriber(): EventSubscriber {
    return this.subscriber;
  }

  bootstrap(definitions: Parameters<EventRegistry["registerMany"]>[0]): void {
    this.registry.registerMany(definitions);
  }

  publish<TTopic extends EventTopic>(
    topic: TTopic,
    source: EventSource,
    payload: EventPayload<TTopic>,
    options?: PublishOptions,
  ): Event<TTopic> {
    const event = this.publisher.publish(topic, source, payload, options);
    this.record(event);
    return event;
  }

  subscribe<TTopic extends EventTopic>(
    topic: TTopic,
    handler: EventHandler<TTopic>,
  ): () => void {
    return this.subscriber.subscribe(topic, handler);
  }

  subscribeAll(handler: EventHandler<EventTopic>): () => void {
    return this.subscriber.subscribeAll(handler);
  }

  subscribeCategory(
    category: EventCategory,
    handler: EventHandler<EventTopic>,
  ): () => void {
    const topics = this.registry
      .getByCategory(category)
      .map((definition) => definition.topic);

    return this.subscriber.subscribeMany(topics, handler);
  }

  getHistory<TTopic extends EventTopic>(
    topic?: TTopic,
    limit = 50,
  ): Event<TTopic>[] {
    const events = topic
      ? this.history.filter((event) => event.topic === topic)
      : this.history;

    return events.slice(0, limit) as Event<TTopic>[];
  }

  getHistoryByCategory(category: EventCategory, limit = 50): Event[] {
    return this.history
      .filter((event) => event.category === category)
      .slice(0, limit);
  }

  clear(): void {
    this.subscriber.clear();
    this.history = [];
  }

  private record(event: Event): void {
    this.history = [event, ...this.history].slice(0, this.historyCapacity);
  }
}
