import { createLiveEvent, type LiveEvent } from "@douglas/monitor";

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function createDemoSeedEvent(
  params: Omit<Parameters<typeof createLiveEvent>[0], "demo">,
): LiveEvent {
  return createLiveEvent({ ...params, demo: true });
}

export const platformMonitorSeedEvents: LiveEvent[] = [
  createDemoSeedEvent({
    source: "core",
    type: "platform:module:registered",
    severity: "success",
    message: "Douglas Core initialized — 9 modules registered",
    timestamp: minutesAgo(12),
    metadata: { moduleCount: 9 },
  }),
  createDemoSeedEvent({
    source: "dos",
    type: "platform:boot:complete",
    severity: "success",
    message: "DOS kernel boot completed",
    timestamp: minutesAgo(11),
    metadata: { environment: "development" },
  }),
  createDemoSeedEvent({
    source: "runtime",
    type: "platform:runtime:started",
    severity: "success",
    message: "Platform Runtime started — 10 modules active",
    timestamp: minutesAgo(10),
    metadata: { moduleCount: 10 },
  }),
  createDemoSeedEvent({
    source: "brain",
    type: "brain:domains:ready",
    severity: "info",
    message: "Brain domains prepared — 8 domains",
    timestamp: minutesAgo(9),
    metadata: { domainCount: 8 },
  }),
  createDemoSeedEvent({
    source: "agents",
    type: "agents:registry:ready",
    severity: "success",
    message: "Agent Framework ready — agents registered",
    timestamp: minutesAgo(8),
    metadata: { status: "ready" },
  }),
  createDemoSeedEvent({
    source: "missions",
    type: "missions:board:loaded",
    severity: "info",
    message: "Mission Control board loaded",
    timestamp: minutesAgo(7),
    metadata: { source: "seed" },
  }),
  createDemoSeedEvent({
    source: "workflow",
    type: "workflow:engine:ready",
    severity: "success",
    message: "Workflow Engine ready for executions",
    timestamp: minutesAgo(6),
    metadata: { engineStatus: "ready" },
  }),
  createDemoSeedEvent({
    source: "automation",
    type: "automation:engine:ready",
    severity: "success",
    message: "Automation Engine listening for triggers",
    timestamp: minutesAgo(5),
    metadata: { engineStatus: "ready" },
  }),
  createDemoSeedEvent({
    source: "analytics",
    type: "analytics:metrics:seeded",
    severity: "info",
    message: "Analytics metric seeds prepared",
    timestamp: minutesAgo(4),
    metadata: { seeded: true },
  }),
  createDemoSeedEvent({
    source: "notifications",
    type: "notifications:center:ready",
    severity: "info",
    message: "Notification Center seeded",
    timestamp: minutesAgo(3),
    metadata: { channel: "internal" },
  }),
  createDemoSeedEvent({
    source: "plugins",
    type: "plugins:validated",
    severity: "warning",
    message: "Plugin validation completed with 1 advisory",
    timestamp: minutesAgo(2),
    metadata: { advisoryCount: 1 },
  }),
  createDemoSeedEvent({
    source: "health",
    type: "health:engine:monitoring",
    severity: "success",
    message: "Health Engine monitoring active",
    timestamp: minutesAgo(1),
    metadata: { intervalMs: 10000 },
  }),
];

const mockRotation = [
  {
    source: "workflow" as const,
    type: "workflow:heartbeat",
    severity: "info" as const,
    message: "Workflow Engine heartbeat — queue idle",
  },
  {
    source: "health" as const,
    type: "health:check:complete",
    severity: "success" as const,
    message: "Scheduled health check completed — all modules healthy",
  },
  {
    source: "runtime" as const,
    type: "runtime:uptime:tick",
    severity: "info" as const,
    message: "Runtime uptime tick recorded",
  },
  {
    source: "agents" as const,
    type: "agents:status:idle",
    severity: "info" as const,
    message: "All agents idle — awaiting tasks",
  },
];

let rotationIndex = 0;

export function getNextMockLiveEvent(): LiveEvent {
  const template = mockRotation[rotationIndex % mockRotation.length]!;
  rotationIndex += 1;
  return createLiveEvent({
    ...template,
    demo: true,
    metadata: { mock: true, rotation: rotationIndex },
  });
}
