import type { Knowledge } from "../types";

export const mockKnowledge: Knowledge[] = [
  {
    id: "knowledge:routing",
    title: "Routing Architecture",
    content: "Sistema centralizado de rotas consumido pela Sidebar e headers.",
    category: "documentation",
    status: "published",
    tags: ["architecture", "routing", "navigation"],
    workspaceId: "ws:douglas-os",
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
  },
  {
    id: "knowledge:command-palette",
    title: "Command Palette",
    content: "Infraestrutura global de comandos, atalhos e busca rápida.",
    category: "reference",
    status: "published",
    tags: ["command-palette", "shortcuts"],
    workspaceId: "ws:douglas-os",
    createdAt: "2026-05-15T00:00:00.000Z",
    updatedAt: "2026-05-15T00:00:00.000Z",
  },
  {
    id: "knowledge:brain-domains",
    title: "Brain Domains",
    content:
      "O Brain é composto por oito domínios: Conversation, Agent, Memory, Workspace, Prompt, Task, Decision e Knowledge.",
    category: "insight",
    status: "draft",
    tags: ["brain", "architecture"],
    workspaceId: "ws:douglas-os",
    createdAt: "2026-07-03T00:00:00.000Z",
    updatedAt: "2026-07-03T00:00:00.000Z",
  },
  {
    id: "knowledge:calma-principles",
    title: "Princípios Calma",
    content: "Bem-estar, mindfulness e comunicação acolhedora.",
    category: "procedure",
    status: "published",
    tags: ["calma", "wellness"],
    workspaceId: "ws:calma",
    createdAt: "2026-02-15T00:00:00.000Z",
    updatedAt: "2026-02-20T00:00:00.000Z",
  },
];
