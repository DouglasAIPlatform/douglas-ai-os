import type { Event } from "./Event";
import type { EventTopic } from "./TypedEvents";

export type EventHandler<TTopic extends EventTopic = EventTopic> = (
  event: Event<TTopic>,
) => void;

export type TypedEventHandler<TTopic extends EventTopic> = EventHandler<TTopic>;
