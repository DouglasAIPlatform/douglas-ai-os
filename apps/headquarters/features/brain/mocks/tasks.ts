import type { BrainTask } from "../types";

export const mockTasks: BrainTask[] = [
  {
    id: "task:brain-architecture",
    title: "Definir arquitetura do Brain",
    description: "Criar domínios, providers e hooks sem integração com IA.",
    status: "in_progress",
    priority: "high",
    agentId: "agent:orchestrator",
    workspaceId: "ws:douglas-os",
    conversationId: "conv:platform-review",
    createdAt: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "task:knowledge-index",
    title: "Indexar documentação interna",
    description: "Preparar base de conhecimento para retrieval futuro.",
    status: "pending",
    priority: "medium",
    agentId: "agent:researcher",
    workspaceId: "ws:douglas-os",
    createdAt: "2026-07-02T00:00:00.000Z",
  },
  {
    id: "task:calma-onboarding",
    title: "Fluxo de onboarding Calma",
    description: "Desenhar jornada inicial do usuário no produto Calma.",
    status: "pending",
    priority: "medium",
    agentId: "agent:wellness",
    workspaceId: "ws:calma",
    createdAt: "2026-06-10T00:00:00.000Z",
  },
];
