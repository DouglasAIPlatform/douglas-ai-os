export type MemoryTier = "short_term" | "long_term";

export type MemoryDomain =
  | "project"
  | "agent"
  | "conversation"
  | "platform";

export type MemoryKind =
  | "fact"
  | "preference"
  | "context"
  | "summary"
  | "decision"
  | (string & {});

export type MemoryHistoryAction = "created" | "updated" | "deleted";

export type MemoryBackendSource =
  | "local"
  | "supabase"
  | "vector"
  | (string & {});

export interface MemoryRecord {
  id: string;
  tier: MemoryTier;
  domain: MemoryDomain;
  kind: MemoryKind;
  content: string;
  workspaceId: string;
  sourceId?: string;
  agentId?: string;
  projectId?: string;
  conversationId?: string;
  tags: string[];
  metadata: Record<string, string | number | boolean>;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  backendId: string;
}

export interface MemoryWriteInput {
  tier: MemoryTier;
  domain: MemoryDomain;
  kind: MemoryKind;
  content: string;
  workspaceId: string;
  sourceId?: string;
  agentId?: string;
  projectId?: string;
  conversationId?: string;
  tags?: string[];
  metadata?: Record<string, string | number | boolean>;
  expiresAt?: string;
  backendId?: string;
}

export interface MemoryFilter {
  tier?: MemoryTier;
  domain?: MemoryDomain;
  kind?: MemoryKind;
  workspaceId?: string;
  sourceId?: string;
  agentId?: string;
  projectId?: string;
  conversationId?: string;
  backendId?: string;
  tag?: string;
}

export interface MemorySearchQuery {
  text?: string;
  filter?: MemoryFilter;
  limit?: number;
  minScore?: number;
}

export interface MemorySearchResult extends MemoryRecord {
  score: number;
  matchedFields: string[];
}

export interface MemoryHistoryEntry {
  id: string;
  action: MemoryHistoryAction;
  recordId: string;
  snapshot: MemoryRecord;
  createdAt: string;
  backendId: string;
}

export interface MemoryIndexSnapshot {
  version: string;
  recordCount: number;
  domains: Record<MemoryDomain, number>;
  tiers: Record<MemoryTier, number>;
  generatedAt: string;
}

export interface MemoryBackendProvider {
  id: string;
  name: string;
  source: MemoryBackendSource;
  tiers: MemoryTier[];
  domains: MemoryDomain[];
  priority: number;
}

export interface MemoryProviderConfig {
  backends: MemoryBackendProvider[];
  defaultBackendId?: string;
}

export const MEMORY_DOMAIN_LABELS: Record<MemoryDomain, string> = {
  project: "Project Memory",
  agent: "Agent Memory",
  conversation: "Conversation Memory",
  platform: "Platform Memory",
};

export const MEMORY_TIER_LABELS: Record<MemoryTier, string> = {
  short_term: "Short Term Memory",
  long_term: "Long Term Memory",
};
