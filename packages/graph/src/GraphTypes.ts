export type DependencyType =
  | "bootstrap"
  | "runtime"
  | "health"
  | "data"
  | "event"
  | "infrastructure";

export type DependencyEdgeStatus =
  | "healthy"
  | "warning"
  | "critical"
  | "missing"
  | "unavailable";

export type DependencyNodeStatus =
  | "healthy"
  | "warning"
  | "critical"
  | "offline"
  | "unknown";

export type DependencyIssueType =
  | "missing_dependency"
  | "circular_dependency"
  | "orphan_module"
  | "critical_unavailable";

export type DependencyGraphStatus = "healthy" | "warning" | "critical";

export interface DependencyNode {
  id: string;
  name: string;
  version: string;
  status: DependencyNodeStatus;
  layer: "platform" | "bootstrap" | "runtime" | "observability";
  description?: string;
  metadata: Record<string, string | number | boolean>;
}

export interface DependencyEdge {
  id: string;
  source: string;
  target: string;
  type: DependencyType;
  required: boolean;
  status: DependencyEdgeStatus;
  description: string;
  metadata: Record<string, string | number | boolean>;
}

export interface DependencyIssue {
  id: string;
  type: DependencyIssueType;
  severity: "warning" | "critical";
  message: string;
  moduleId?: string;
  edgeId?: string;
  detectedAt: string;
}

export interface DependencyReport {
  status: DependencyGraphStatus;
  moduleCount: number;
  edgeCount: number;
  healthyEdgeCount: number;
  warningEdgeCount: number;
  criticalEdgeCount: number;
  orphanModuleCount: number;
  circularDependencyCount: number;
  missingDependencyCount: number;
  criticalUnavailableCount: number;
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  issues: DependencyIssue[];
  loadOrder: string[];
  generatedAt: string;
}

export interface DependencyGraphInput {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export const DEPENDENCY_TYPE_LABELS: Record<DependencyType, string> = {
  bootstrap: "Bootstrap",
  runtime: "Runtime",
  health: "Health",
  data: "Dados",
  event: "Evento",
  infrastructure: "Infraestrutura",
};

export const DEPENDENCY_EDGE_STATUS_LABELS: Record<DependencyEdgeStatus, string> = {
  healthy: "Saudável",
  warning: "Alerta",
  critical: "Crítico",
  missing: "Ausente",
  unavailable: "Indisponível",
};

export const DEPENDENCY_GRAPH_STATUS_LABELS: Record<DependencyGraphStatus, string> = {
  healthy: "Saudável",
  warning: "Alerta",
  critical: "Crítico",
};

export const DEPENDENCY_ISSUE_TYPE_LABELS: Record<DependencyIssueType, string> = {
  missing_dependency: "Dependência ausente",
  circular_dependency: "Dependência circular",
  orphan_module: "Módulo órfão",
  critical_unavailable: "Crítica indisponível",
};
