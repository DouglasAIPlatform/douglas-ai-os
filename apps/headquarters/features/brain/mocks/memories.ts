import type { Memory } from "../types";

export const mockMemories: Memory[] = [
  {
    id: "memory:platform-mission",
    scope: "global",
    kind: "fact",
    content: "Douglas AI Platform é um sistema operacional para produtos e agentes.",
    workspaceId: "ws:douglas-os",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "memory:user-preference",
    scope: "workspace",
    kind: "preference",
    content: "Douglas prefere respostas concisas com contexto arquitetural.",
    workspaceId: "ws:douglas-os",
    createdAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "memory:session-context",
    scope: "session",
    kind: "context",
    content: "Sprint 3.0 focada na infraestrutura do Brain, sem IA real.",
    sourceId: "conv:platform-review",
    workspaceId: "ws:douglas-os",
    agentId: "agent:orchestrator",
    createdAt: "2026-07-03T00:00:00.000Z",
    expiresAt: "2026-07-04T00:00:00.000Z",
  },
  {
    id: "memory:calma-tone",
    scope: "agent",
    kind: "summary",
    content: "Tom empático e acolhedor para interações do produto Calma.",
    workspaceId: "ws:calma",
    agentId: "agent:wellness",
    createdAt: "2026-02-15T00:00:00.000Z",
  },
];
