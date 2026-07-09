import type { EventHandler } from "./EventHandler";
import type { EventTopic } from "./TypedEvents";

export type Unsubscribe = () => void;

export class EventSubscriber {
  private handlers = new Map<EventTopic | "*", Set<EventHandler<EventTopic>>>();

  subscribe<TTopic extends EventTopic>(
    topic: TTopic,
    handler: EventHandler<TTopic>,
  ): Unsubscribe {
    return this.addHandler(topic, handler as EventHandler<EventTopic>);
  }

  subscribeAll(handler: EventHandler<EventTopic>): Unsubscribe {
    return this.addHandler("*", handler);
  }

  subscribeMany<TTopic extends EventTopic>(
    topics: TTopic[],
    handler: EventHandler<TTopic>,
  ): Unsubscribe {
    const unsubscribers = topics.map((topic) => this.subscribe(topic, handler));

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }

  dispatch(event: Parameters<EventHandler<EventTopic>>[0]): void {
    this.handlers.get(event.topic)?.forEach((handler) => handler(event));
    this.handlers.get("*")?.forEach((handler) => handler(event));
  }

  clear(): void {
    this.handlers.clear();
  }

  count(topic?: EventTopic | "*"): number {
    if (!topic) {
      return Array.from(this.handlers.values()).reduce(
        (total, bucket) => total + bucket.size,
        0,
      );
    }

    return this.handlers.get(topic)?.size ?? 0;
  }

  private addHandler(
    topic: EventTopic | "*",
    handler: EventHandler<EventTopic>,
  ): Unsubscribe {
    const bucket = this.handlers.get(topic) ?? new Set<EventHandler<EventTopic>>();
    bucket.add(handler);
    this.handlers.set(topic, bucket);

    return () => {
      bucket.delete(handler);
    };
  }
}
