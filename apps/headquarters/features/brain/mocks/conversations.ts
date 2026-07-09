import type { Conversation, ConversationMessage } from "../types";

export const mockConversations: Conversation[] = [
  {
    id: "conv:platform-review",
    title: "Revisão da arquitetura da plataforma",
    status: "active",
    workspaceId: "ws:douglas-os",
    agentId: "agent:orchestrator",
    messageIds: ["msg:1", "msg:2", "msg:3"],
    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-06-01T10:15:00.000Z",
  },
  {
    id: "conv:calma-roadmap",
    title: "Roadmap Calma Q3",
    status: "paused",
    workspaceId: "ws:calma",
    agentId: "agent:wellness",
    messageIds: ["msg:4"],
    createdAt: "2026-06-10T14:00:00.000Z",
    updatedAt: "2026-06-10T14:05:00.000Z",
  },
];

export const mockConversationMessages: ConversationMessage[] = [
  {
    id: "msg:1",
    conversationId: "conv:platform-review",
    role: "user",
    content: "Quais domínios compõem o Brain da plataforma?",
    createdAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "msg:2",
    conversationId: "conv:platform-review",
    role: "assistant",
    content:
      "Conversation, Agent, Memory, Workspace, Prompt, Task, Decision e Knowledge.",
    createdAt: "2026-06-01T10:05:00.000Z",
  },
  {
    id: "msg:3",
    conversationId: "conv:platform-review",
    role: "system",
    content: "Conversa arquivada para referência futura.",
    createdAt: "2026-06-01T10:15:00.000Z",
  },
  {
    id: "msg:4",
    conversationId: "conv:calma-roadmap",
    role: "user",
    content: "Prioridades do produto Calma para o próximo trimestre.",
    createdAt: "2026-06-10T14:00:00.000Z",
  },
];
