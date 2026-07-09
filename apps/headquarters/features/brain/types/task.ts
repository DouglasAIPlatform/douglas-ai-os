export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export type TaskPriority = "low" | "medium" | "high";

export interface BrainTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  agentId?: string;
  workspaceId: string;
  conversationId?: string;
  createdAt: string;
  dueAt?: string;
}
