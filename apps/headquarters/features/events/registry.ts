import {
  EVENT_CATEGORIES,
  TOPIC_CATEGORY,
  type EventDefinition,
  type EventTopic,
} from "@douglas/events";

function defineEvent(
  topic: EventTopic,
  description: string,
  publishers: string[],
  subscribers: string[],
): EventDefinition {
  return {
    topic,
    category: TOPIC_CATEGORY[topic],
    description,
    version: 1,
    publishers,
    subscribers,
  };
}

export const corporateEventDefinitions: EventDefinition[] = [
  ...EVENT_CATEGORIES.system.map((topic) =>
    defineEvent(
      topic,
      `System event: ${topic}`,
      ["core"],
      ["analytics", "notifications", "brain"],
    ),
  ),
  ...EVENT_CATEGORIES.runtime.map((topic) =>
    defineEvent(
      topic,
      `Runtime control event: ${topic}`,
      ["runtime"],
      ["analytics", "notifications", "health"],
    ),
  ),
  ...EVENT_CATEGORIES.diagnostics.map((topic) =>
    defineEvent(
      topic,
      `Diagnostics report event: ${topic}`,
      ["core"],
      ["analytics", "monitor", "health"],
    ),
  ),
  ...EVENT_CATEGORIES.security.map((topic) =>
    defineEvent(
      topic,
      `Security action event: ${topic}`,
      ["authentication"],
      ["analytics", "monitor", "notifications"],
    ),
  ),
  ...EVENT_CATEGORIES.internal.map((topic) =>
    defineEvent(
      topic,
      `Internal event: ${topic}`,
      ["core"],
      ["analytics", "brain", "agents"],
    ),
  ),
  ...EVENT_CATEGORIES.ai.map((topic) =>
    defineEvent(
      topic,
      `AI event: ${topic}`,
      ["agents", "brain"],
      ["analytics", "memory", "notifications"],
    ),
  ),
  ...EVENT_CATEGORIES.workflow.map((topic) =>
    defineEvent(
      topic,
      `Workflow event: ${topic}`,
      ["workflow"],
      ["automation", "analytics", "notifications"],
    ),
  ),
  ...EVENT_CATEGORIES.automation.map((topic) =>
    defineEvent(
      topic,
      `Automation event: ${topic}`,
      ["automation"],
      ["analytics", "notifications", "workflow"],
    ),
  ),
  ...EVENT_CATEGORIES.calma.map((topic) =>
    defineEvent(
      topic,
      `Calma event: ${topic}`,
      ["calma"],
      ["analytics", "memory", "notifications"],
    ),
  ),
  ...EVENT_CATEGORIES.youtube.map((topic) =>
    defineEvent(
      topic,
      `YouTube event: ${topic}`,
      ["youtube"],
      ["analytics", "workflow", "notifications"],
    ),
  ),
  ...EVENT_CATEGORIES.missions.map((topic) =>
    defineEvent(
      topic,
      `Mission execution event: ${topic}`,
      ["missions"],
      ["analytics", "monitor", "notifications"],
    ),
  ),
  ...EVENT_CATEGORIES.agents.map((topic) =>
    defineEvent(
      topic,
      `Operational agent event: ${topic}`,
      ["agents"],
      ["analytics", "monitor", "audit"],
    ),
  ),
];
