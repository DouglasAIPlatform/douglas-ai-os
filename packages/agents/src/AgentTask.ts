export type AgentTaskStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface AgentTaskRecord {
  id: string;
  title: string;
  description: string;
  status: AgentTaskStatus;
  priority: "low" | "normal" | "high" | "critical";
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface AgentTaskInput {
  title: string;
  description: string;
  priority?: AgentTaskRecord["priority"];
  metadata?: Record<string, string | number | boolean>;
}

export function createAgentTask(input: AgentTaskInput): AgentTaskRecord {
  const now = new Date().toISOString();

  return {
    id: `task:${Date.now()}`,
    title: input.title,
    description: input.description,
    status: "queued",
    priority: input.priority ?? "normal",
    createdAt: now,
    updatedAt: now,
    metadata: input.metadata,
  };
}

export function updateAgentTaskStatus(
  task: AgentTaskRecord,
  status: AgentTaskStatus,
): AgentTaskRecord {
  const now = new Date().toISOString();

  return {
    ...task,
    status,
    updatedAt: now,
    completedAt:
      status === "completed" || status === "failed" || status === "cancelled"
        ? now
        : task.completedAt,
  };
}
