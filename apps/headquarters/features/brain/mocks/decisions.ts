import type { Decision } from "../types";

export const mockDecisions: Decision[] = [
  {
    id: "decision:brain-modular",
    title: "Brain modular por domínio",
    rationale:
      "Separar Conversation, Agent, Memory e demais domínios facilita evolução independente.",
    status: "approved",
    agentId: "agent:orchestrator",
    taskId: "task:brain-architecture",
    workspaceId: "ws:douglas-os",
    createdAt: "2026-07-01T12:00:00.000Z",
  },
  {
    id: "decision:defer-ai",
    title: "Adiar integração com IA",
    rationale:
      "Estabelecer contratos e providers antes de conectar modelos ou APIs externas.",
    status: "executed",
    workspaceId: "ws:douglas-os",
    createdAt: "2026-07-02T09:00:00.000Z",
  },
  {
    id: "decision:calma-tone",
    title: "Tom empático no Calma",
    rationale: "Alinhar comunicação do agente wellness ao posicionamento do produto.",
    status: "proposed",
    agentId: "agent:wellness",
    taskId: "task:calma-onboarding",
    workspaceId: "ws:calma",
    createdAt: "2026-06-11T10:00:00.000Z",
  },
];
