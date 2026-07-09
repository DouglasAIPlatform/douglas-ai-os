export type MissionPriority = "low" | "normal" | "high" | "critical";

export type MissionStatus =
  | "draft"
  | "planned"
  | "active"
  | "blocked"
  | "completed"
  | "failed"
  | "archived";

export type MissionScopeType = "project" | "agent" | "department" | "product";

export type MissionExecutionMode = "manual" | "automatic";

export type MissionTimelineEventType =
  | "created"
  | "status_change"
  | "progress_update"
  | "scope_linked"
  | "execution_scheduled"
  | "note";

export type MissionHistoryAction =
  | "created"
  | "updated"
  | "started"
  | "progress_updated"
  | "completed"
  | "failed"
  | "blocked"
  | "archived";

export interface MissionScope {
  type: MissionScopeType;
  refId: string;
  label?: string;
}

export interface MissionExecutionPolicy {
  mode: MissionExecutionMode;
  retryable?: boolean;
  maxRetries?: number;
  scheduledAt?: string;
  executorId?: string;
}

export interface MissionProgressState {
  percent: number;
  currentStep?: string;
  totalSteps?: number;
  completedSteps?: number;
}

export interface MissionMetadata {
  tags?: string[];
  ownerId?: string;
  [key: string]: string | number | boolean | string[] | null | undefined;
}

export interface MissionData {
  id: string;
  title: string;
  description: string;
  status: MissionStatus;
  priority: MissionPriority;
  progress: MissionProgressState;
  scopes: MissionScope[];
  execution: MissionExecutionPolicy;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  metadata: MissionMetadata;
}

export interface MissionInput {
  title: string;
  description?: string;
  priority?: MissionPriority;
  scopes?: MissionScope[];
  execution?: Partial<MissionExecutionPolicy>;
  metadata?: MissionMetadata;
}

export interface MissionFilter {
  status?: MissionStatus;
  priority?: MissionPriority;
  scopeType?: MissionScopeType;
  scopeRefId?: string;
  executionMode?: MissionExecutionMode;
}

export interface MissionTimelineEntry {
  id: string;
  missionId: string;
  type: MissionTimelineEventType;
  title: string;
  description?: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface MissionHistoryEntry {
  id: string;
  missionId: string;
  action: MissionHistoryAction;
  snapshot: MissionData;
  timestamp: string;
}

export interface MissionBoardColumn {
  status: MissionStatus;
  label: string;
  missions: MissionData[];
}

export interface MissionBoardView {
  columns: MissionBoardColumn[];
  total: number;
  activeCount: number;
  completedCount: number;
}

export const MISSION_PRIORITY_LABELS: Record<MissionPriority, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  critical: "Crítica",
};

export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  draft: "Rascunho",
  planned: "Planejada",
  active: "Ativa",
  blocked: "Bloqueada",
  completed: "Concluída",
  failed: "Falhou",
  archived: "Arquivada",
};

export const MISSION_SCOPE_LABELS: Record<MissionScopeType, string> = {
  project: "Projeto",
  agent: "Agente",
  department: "Departamento",
  product: "Produto",
};

export const MISSION_BOARD_STATUSES: MissionStatus[] = [
  "planned",
  "active",
  "blocked",
  "completed",
];

export const MISSION_PRIORITY_ORDER: Record<MissionPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};
