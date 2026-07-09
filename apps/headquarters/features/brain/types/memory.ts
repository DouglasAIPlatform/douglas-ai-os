export type MemoryScope = "session" | "workspace" | "agent" | "global";

export type MemoryKind = "fact" | "preference" | "context" | "summary";

export interface Memory {
  id: string;
  scope: MemoryScope;
  kind: MemoryKind;
  content: string;
  sourceId?: string;
  workspaceId: string;
  agentId?: string;
  createdAt: string;
  expiresAt?: string;
}
