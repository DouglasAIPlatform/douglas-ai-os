export type DepartmentId =
  | "pesquisa"
  | "desenvolvimento"
  | "ux"
  | "marketing"
  | "conteudo"
  | "video"
  | "financeiro"
  | "automacoes"
  | "inteligencia"
  | (string & {});

export type DepartmentStatusName =
  | "idle"
  | "active"
  | "busy"
  | "degraded"
  | "offline";

export type DepartmentHealthStatus = "healthy" | "degraded" | "unhealthy";

export type DepartmentTaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed";

export interface DepartmentMetadata {
  lead?: string;
  tags?: string[];
  [key: string]: string | number | boolean | string[] | null | undefined;
}

export interface DepartmentDefinition {
  id: DepartmentId;
  name: string;
  description: string;
  status: DepartmentStatusName;
  metadata?: DepartmentMetadata;
}

export interface DepartmentAgentRegistration {
  agentId: string;
  departmentId: DepartmentId;
  registeredAt: string;
}

export interface DepartmentTaskInput {
  title: string;
  description?: string;
  priority?: "low" | "normal" | "high";
  metadata?: Record<string, string | number | boolean | null>;
}

export interface DepartmentTask {
  id: string;
  departmentId: DepartmentId;
  title: string;
  description?: string;
  status: DepartmentTaskStatus;
  priority: "low" | "normal" | "high";
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, string | number | boolean | null>;
}

export interface DepartmentEventInput {
  topic: string;
  payload?: Record<string, string | number | boolean | null>;
}

export interface DepartmentEvent {
  id: string;
  departmentId: DepartmentId;
  topic: string;
  payload: Record<string, string | number | boolean | null>;
  publishedAt: string;
}

export interface DepartmentMetricInput {
  key: string;
  label: string;
  value: number;
}

export interface DepartmentMetric {
  id: string;
  departmentId: DepartmentId;
  key: string;
  label: string;
  value: number;
  recordedAt: string;
}

export interface DepartmentHealthReport {
  departmentId: DepartmentId;
  status: DepartmentHealthStatus;
  message: string;
  checkedAt: string;
  agentCount: number;
  taskCount: number;
  activeTasks: number;
  pendingTasks: number;
}

export interface DepartmentMetricsSnapshot {
  departmentId: DepartmentId;
  metrics: DepartmentMetric[];
  taskCompletionRate: number;
  averageTasksPerAgent: number;
}

export interface DepartmentFilter {
  status?: DepartmentStatusName;
  tag?: string;
}

export const DEPARTMENT_LABELS: Record<string, string> = {
  pesquisa: "Pesquisa",
  desenvolvimento: "Desenvolvimento",
  ux: "UX",
  marketing: "Marketing",
  conteudo: "Conteúdo",
  video: "Vídeo",
  financeiro: "Financeiro",
  automacoes: "Automações",
  inteligencia: "Inteligência",
};

export const DEPARTMENT_STATUS_LABELS: Record<DepartmentStatusName, string> = {
  idle: "Idle",
  active: "Ativo",
  busy: "Ocupado",
  degraded: "Degradado",
  offline: "Offline",
};

export const DEPARTMENT_HEALTH_LABELS: Record<DepartmentHealthStatus, string> = {
  healthy: "Saudável",
  degraded: "Degradado",
  unhealthy: "Crítico",
};
