import type { MemoryBackendProvider } from "@douglas/memory";

export const memoryBackends: MemoryBackendProvider[] = [
  {
    id: "backend:local-core",
    name: "Local Core Memory",
    source: "local",
    tiers: ["short_term", "long_term"],
    domains: ["platform", "project", "agent", "conversation"],
    priority: 100,
  },
  {
    id: "backend:local-short",
    name: "Local Short Term",
    source: "local",
    tiers: ["short_term"],
    domains: ["conversation", "agent"],
    priority: 200,
  },
];

export const defaultMemoryBackendId = "backend:local-core";
