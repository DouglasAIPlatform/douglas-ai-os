export type AgentMemoryKind = "fact" | "preference" | "context" | "summary";

export type AgentMemoryScope = "session" | "agent" | "workspace" | "global";

export interface AgentMemoryEntry {
  id: string;
  kind: AgentMemoryKind;
  scope: AgentMemoryScope;
  content: string;
  sourceId?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface AgentMemoryState {
  entries: AgentMemoryEntry[];
  capacity: number;
}

export interface AgentMemoryWriteInput {
  kind: AgentMemoryKind;
  scope: AgentMemoryScope;
  content: string;
  sourceId?: string;
  expiresAt?: string;
}

export function createEmptyAgentMemory(capacity = 100): AgentMemoryState {
  return {
    entries: [],
    capacity,
  };
}

export function writeAgentMemory(
  state: AgentMemoryState,
  input: AgentMemoryWriteInput,
): AgentMemoryState {
  const entry: AgentMemoryEntry = {
    id: `memory:${Date.now()}:${state.entries.length}`,
    kind: input.kind,
    scope: input.scope,
    content: input.content,
    sourceId: input.sourceId,
    createdAt: new Date().toISOString(),
    expiresAt: input.expiresAt,
  };

  const nextEntries = [entry, ...state.entries].slice(0, state.capacity);

  return {
    ...state,
    entries: nextEntries,
  };
}

export function readAgentMemory(
  state: AgentMemoryState,
  scope?: AgentMemoryScope,
): AgentMemoryEntry[] {
  if (!scope) return state.entries;
  return state.entries.filter((entry) => entry.scope === scope);
}
