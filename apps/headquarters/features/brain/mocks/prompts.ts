import type { Prompt } from "../types";

export const mockPrompts: Prompt[] = [
  {
    id: "prompt:orchestrator-system",
    name: "Orchestrator System",
    template:
      "Você é o agente orquestrador do workspace {{workspace}}. Coordene tarefas e decisões.",
    variables: ["workspace"],
    status: "active",
    agentId: "agent:orchestrator",
    workspaceId: "ws:douglas-os",
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "prompt:researcher-system",
    name: "Researcher System",
    template:
      "Recupere conhecimento relevante para {{query}} no workspace {{workspace}}.",
    variables: ["query", "workspace"],
    status: "active",
    agentId: "agent:researcher",
    workspaceId: "ws:douglas-os",
    version: 1,
    createdAt: "2026-01-05T00:00:00.000Z",
  },
  {
    id: "prompt:decision-review",
    name: "Decision Review",
    template: "Avalie a decisão proposta: {{decision}}. Justifique com {{rationale}}.",
    variables: ["decision", "rationale"],
    status: "draft",
    workspaceId: "ws:douglas-os",
    version: 1,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
];
