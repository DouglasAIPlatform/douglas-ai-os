export type AgentEventType =
  | "agent:activated"
  | "agent:deactivated"
  | "agent:status_changed"
  | "memory:written"
  | "task:assigned"
  | "task:completed"
  | "task:failed"
  | "inference:requested"
  | "inference:completed"
  | (string & {});

export interface AgentEventRecord {
  id: string;
  type: AgentEventType;
  agentId: string;
  payload: Record<string, string | number | boolean | null | undefined>;
  createdAt: string;
}

export interface AgentEventListener {
  (event: AgentEventRecord): void;
}

export function createAgentEvent(
  type: AgentEventType,
  agentId: string,
  payload: AgentEventRecord["payload"] = {},
): AgentEventRecord {
  return {
    id: `event:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    type,
    agentId,
    payload,
    createdAt: new Date().toISOString(),
  };
}

export class AgentEventBus {
  private listeners = new Map<AgentEventType | "*", Set<AgentEventListener>>();

  on(type: AgentEventType | "*", listener: AgentEventListener): () => void {
    const bucket = this.listeners.get(type) ?? new Set<AgentEventListener>();
    bucket.add(listener);
    this.listeners.set(type, bucket);

    return () => {
      bucket.delete(listener);
    };
  }

  emit(event: AgentEventRecord): void {
    const specificListeners = this.listeners.get(event.type);
    const globalListeners = this.listeners.get("*");

    specificListeners?.forEach((listener) => listener(event));
    globalListeners?.forEach((listener) => listener(event));
  }

  clear(): void {
    this.listeners.clear();
  }
}
