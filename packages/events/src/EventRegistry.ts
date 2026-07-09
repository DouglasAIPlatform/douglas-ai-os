import type { EventCategory, EventTopic } from "./TypedEvents";
import { TOPIC_CATEGORY } from "./TypedEvents";

export interface EventDefinition<TTopic extends EventTopic = EventTopic> {
  topic: TTopic;
  category: EventCategory;
  description: string;
  version: number;
  publishers: string[];
  subscribers: string[];
}

export class EventRegistry {
  private definitions = new Map<EventTopic, EventDefinition>();

  register<TTopic extends EventTopic>(definition: EventDefinition<TTopic>): void {
    this.definitions.set(definition.topic, definition as EventDefinition);
  }

  registerMany(definitions: EventDefinition[]): void {
    definitions.forEach((definition) => this.register(definition));
  }

  registerFromTopics(
    topics: EventTopic[],
    defaults: Pick<EventDefinition, "publishers" | "subscribers" | "version">,
  ): void {
    topics.forEach((topic) => {
      this.register({
        topic,
        category: TOPIC_CATEGORY[topic],
        description: `Corporate event: ${topic}`,
        version: defaults.version,
        publishers: defaults.publishers,
        subscribers: defaults.subscribers,
      });
    });
  }

  get(topic: EventTopic): EventDefinition | undefined {
    return this.definitions.get(topic);
  }

  has(topic: EventTopic): boolean {
    return this.definitions.has(topic);
  }

  getAll(): EventDefinition[] {
    return Array.from(this.definitions.values());
  }

  getByCategory(category: EventCategory): EventDefinition[] {
    return this.getAll().filter((definition) => definition.category === category);
  }

  size(): number {
    return this.definitions.size;
  }

  clear(): void {
    this.definitions.clear();
  }
}
