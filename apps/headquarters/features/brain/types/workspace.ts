export type WorkspaceStatus = "active" | "archived";

export interface Workspace {
  id: string;
  name: string;
  description: string;
  status: WorkspaceStatus;
  agentIds: string[];
  createdAt: string;
}
