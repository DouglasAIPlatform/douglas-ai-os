export type PromptStatus = "draft" | "active" | "deprecated";

export interface Prompt {
  id: string;
  name: string;
  template: string;
  variables: string[];
  status: PromptStatus;
  agentId?: string;
  workspaceId: string;
  version: number;
  createdAt: string;
}
