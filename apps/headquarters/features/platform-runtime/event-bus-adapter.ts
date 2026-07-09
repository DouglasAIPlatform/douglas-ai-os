import type { IRuntimeEventBus } from "@douglas/runtime";
import type { EventBus } from "@douglas/events";

export function createRuntimeEventBusAdapter(eventBus: EventBus): IRuntimeEventBus {
  return {
    publish(topic, source, payload) {
      eventBus.publish(
        topic as Parameters<EventBus["publish"]>[0],
        source as Parameters<EventBus["publish"]>[1],
        payload as unknown as Parameters<EventBus["publish"]>[2],
      );
    },
    subscribe(topic, handler) {
      return eventBus.subscribe(
        topic as Parameters<EventBus["subscribe"]>[0],
        (event) => {
          handler(event.payload as unknown as Record<string, unknown>);
        },
      );
    },
  };
}
