import type { Workspace } from "../types";

export const mockWorkspaces: Workspace[] = [
  {
    id: "ws:douglas-os",
    name: "Douglas AI OS",
    description: "Workspace principal de inteligência operacional.",
    status: "active",
    agentIds: ["agent:orchestrator", "agent:researcher", "agent:writer"],
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "ws:calma",
    name: "Calma",
    description: "Workspace dedicado ao produto Calma.",
    status: "active",
    agentIds: ["agent:wellness"],
    createdAt: "2026-02-15T00:00:00.000Z",
  },
];
