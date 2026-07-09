export type AgentCapability =
  | "reasoning"
  | "retrieval"
  | "planning"
  | "execution";

export type BrainAgentStatus = "idle" | "active" | "disabled";

export interface BrainAgent {
  id: string;
  name: string;
  description: string;
  status: BrainAgentStatus;
  capabilities: AgentCapability[];
  workspaceId: string;
  defaultPromptId?: string;
  createdAt: string;
}
