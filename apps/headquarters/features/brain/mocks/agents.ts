import type { BrainAgent } from "../types";

export const mockBrainAgents: BrainAgent[] = [
  {
    id: "agent:orchestrator",
    name: "Orchestrator",
    description: "Coordena agentes, tarefas e decisões do workspace.",
    status: "active",
    capabilities: ["reasoning", "planning", "execution"],
    workspaceId: "ws:douglas-os",
    defaultPromptId: "prompt:orchestrator-system",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "agent:researcher",
    name: "Researcher",
    description: "Recupera conhecimento e consolida memória contextual.",
    status: "idle",
    capabilities: ["retrieval", "reasoning"],
    workspaceId: "ws:douglas-os",
    defaultPromptId: "prompt:researcher-system",
    createdAt: "2026-01-05T00:00:00.000Z",
  },
  {
    id: "agent:writer",
    name: "Writer",
    description: "Produz documentação, resumos e respostas estruturadas.",
    status: "idle",
    capabilities: ["reasoning", "execution"],
    workspaceId: "ws:douglas-os",
    createdAt: "2026-01-10T00:00:00.000Z",
  },
  {
    id: "agent:wellness",
    name: "Wellness Guide",
    description: "Agente especializado no domínio Calma.",
    status: "active",
    capabilities: ["retrieval", "reasoning"],
    workspaceId: "ws:calma",
    createdAt: "2026-02-15T00:00:00.000Z",
  },
];
