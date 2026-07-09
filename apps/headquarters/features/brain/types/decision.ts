export type DecisionStatus = "proposed" | "approved" | "rejected" | "executed";

export interface Decision {
  id: string;
  title: string;
  rationale: string;
  status: DecisionStatus;
  agentId?: string;
  taskId?: string;
  workspaceId: string;
  createdAt: string;
}
