import type { AgentEventRecord } from "./AgentEvents";
import type { AgentMemoryState } from "./AgentMemory";
import type { AgentTaskRecord } from "./AgentTask";

export type AgentStatus =
  | "idle"
  | "active"
  | "busy"
  | "disabled"
  | "offline";

export type AgentPriority = "low" | "normal" | "high" | "critical";

export type AgentCapability =
  | "reasoning"
  | "retrieval"
  | "planning"
  | "execution"
  | "communication"
  | "analysis"
  | (string & {});

export type AgentPermission =
  | "read:workspace"
  | "write:memory"
  | "read:memory"
  | "execute:task"
  | "manage:tasks"
  | "emit:events"
  | "invoke:llm"
  | (string & {});

export interface AgentMetadata {
  version?: string;
  workspaceId?: string;
  tags?: string[];
  inferenceAdapterId?: string | null;
  [key: string]: string | number | boolean | string[] | null | undefined;
}

export interface AgentDefinition {
  id: string;
  name: string;
  department: string;
  description: string;
  status: AgentStatus;
  priority: AgentPriority;
  permissions: AgentPermission[];
  capabilities: AgentCapability[];
  metadata?: AgentMetadata;
}

export interface AgentInstance extends AgentDefinition {
  memory: AgentMemoryState;
  tasks: AgentTaskRecord[];
  events: AgentEventRecord[];
}

export interface AgentRegistryFilter {
  department?: string;
  status?: AgentStatus;
  priority?: AgentPriority;
  capability?: AgentCapability;
  permission?: AgentPermission;
}

export interface AgentFactoryOptions {
  typeId?: string;
}

export interface InferenceAdapterReference {
  adapterId: string;
  modelId?: string;
  provider?: "openai" | "anthropic" | "gemini" | "local" | (string & {});
}

export interface AgentLifecycleHooks {
  onActivate?: (agentId: string) => void | Promise<void>;
  onDeactivate?: (agentId: string) => void | Promise<void>;
  onTaskAssigned?: (agentId: string, taskId: string) => void | Promise<void>;
}
