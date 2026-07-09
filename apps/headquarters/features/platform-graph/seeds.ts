import type { DependencyGraphInput } from "@douglas/graph";
import {
  DependencyEdgeRegistry,
  DependencyNodeRegistry,
} from "@douglas/graph";

const VERSION = "0.1.0";

function node(
  id: string,
  name: string,
  layer: "platform" | "bootstrap" | "runtime" | "observability",
  status: "healthy" | "warning" | "critical" | "offline" | "unknown" = "healthy",
) {
  return DependencyNodeRegistry.create({
    id,
    name,
    version: VERSION,
    status,
    layer,
    metadata: { registered: true },
  });
}

function edge(
  source: string,
  target: string,
  type: "bootstrap" | "runtime" | "health" | "data" | "event" | "infrastructure",
  required: boolean,
  status: "healthy" | "warning" | "critical" | "missing" | "unavailable",
  description: string,
) {
  return DependencyEdgeRegistry.create(source, target, {
    type,
    required,
    status,
    description,
    metadata: { validated: status === "healthy" },
  });
}

export const platformDependencyGraphInput: DependencyGraphInput = {
  nodes: [
    node("core", "Douglas Core", "platform"),
    node("dos", "Douglas Operating System", "bootstrap"),
    node("runtime", "Platform Runtime", "runtime"),
    node("brain", "Douglas Brain", "platform"),
    node("agents", "Agent Framework", "platform"),
    node("missions", "Mission Control", "platform"),
    node("workflow", "Workflow Engine", "platform"),
    node("automation", "Automation Engine", "platform"),
    node("analytics", "Analytics Engine", "platform", "warning"),
    node("notifications", "Notification Center", "platform"),
    node("plugins", "Plugin System", "platform"),
    node("health", "Health Engine", "observability"),
  ],
  edges: [
    edge("dos", "core", "bootstrap", true, "healthy", "DOS requires Core kernel"),
    edge("runtime", "core", "infrastructure", true, "healthy", "Runtime requires Core"),
    edge("runtime", "dos", "runtime", true, "healthy", "Runtime boots after DOS"),
    edge("brain", "core", "bootstrap", true, "healthy", "Brain domains on Core"),
    edge("agents", "core", "bootstrap", true, "healthy", "Agents registered via Core"),
    edge("plugins", "dos", "bootstrap", true, "warning", "Plugins validated via DOS kernel"),
    edge("workflow", "agents", "runtime", true, "healthy", "Workflow executes via Agents"),
    edge("automation", "workflow", "runtime", true, "healthy", "Automation triggers workflows"),
    edge("missions", "agents", "data", true, "healthy", "Missions assign agents"),
    edge("analytics", "workflow", "data", true, "healthy", "Analytics consumes workflow metrics"),
    edge("analytics", "automation", "data", false, "warning", "Optional automation metrics"),
    edge("notifications", "core", "event", true, "healthy", "Notifications via Core events"),
    edge("health", "runtime", "health", true, "healthy", "Health Engine observes Runtime"),
    edge("health", "core", "health", false, "healthy", "Health Engine observes Bootstrap/Core"),
  ],
};
