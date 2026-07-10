import type {
  ActionConfirmationRiskLevel,
  OperatorRole,
  SecuredActionType,
  SecurityActionEventPayload,
} from "@douglas/events";

export type {
  ActionConfirmationRiskLevel,
  OperatorRole,
  SecuredActionType,
  SecurityActionEventPayload,
};

export type Permission =
  | "platform:view"
  | "runtime:refresh"
  | "runtime:health_check"
  | "runtime:pause"
  | "runtime:resume"
  | "runtime:restart"
  | "security:manage_roles"
  | "security:manage_owners"
  | "release:approve_production"
  | "platform:critical_configuration";

export interface Operator {
  id: string;
  name: string;
  role: OperatorRole;
}

export interface PermissionCheckResult {
  allowed: boolean;
  permission: Permission;
  reason?: string;
}

export interface ActionGuardResult {
  allowed: boolean;
  requiresConfirmation: boolean;
  blockedByPermission: boolean;
  permission: Permission;
  reason?: string;
}

export interface ActionConfirmationRequest {
  id: string;
  operatorId: string;
  moduleId: string;
  action: SecuredActionType;
  moduleName: string;
  actionLabel: string;
  risk: ActionConfirmationRiskLevel;
  consequence: string;
  /** Contexto adicional (ex.: readiness degradado). */
  message?: string;
  requestedAt: string;
}

export interface ActionConfirmationRequestInput {
  moduleId: string;
  moduleName: string;
  action: SecuredActionType;
  actionLabel: string;
  risk: ActionConfirmationRiskLevel;
  consequence: string;
  message?: string;
}

export interface ActionConfirmationResult {
  requestId: string;
  confirmed: boolean;
  resolvedAt: string;
}

export interface ActionAuditEntry {
  id: string;
  operatorId: string;
  operatorRole: OperatorRole;
  moduleId: string;
  action: SecuredActionType;
  outcome: "allowed" | "blocked" | "confirmed" | "cancelled" | "requested" | "executed";
  message: string;
  timestamp: string;
  requestId?: string;
  correlationId?: string;
}

export interface SecurityRecordExtras {
  requestId?: string;
  correlationId?: string;
}

export const OPERATOR_ROLE_LABELS: Record<OperatorRole, string> = {
  owner: "Owner",
  admin: "Admin",
  operator: "Operator",
  viewer: "Viewer",
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  "platform:view": "Visualizar plataforma",
  "runtime:refresh": "Refresh de módulo",
  "runtime:health_check": "Health check",
  "runtime:pause": "Pausar módulo",
  "runtime:resume": "Retomar módulo",
  "runtime:restart": "Reiniciar módulo",
  "security:manage_roles": "Gerenciar roles operacionais",
  "security:manage_owners": "Gerenciar owners",
  "release:approve_production": "Aprovar release em produção",
  "platform:critical_configuration": "Configuração crítica da plataforma",
};

export const SECURITY_EVENT_TOPICS = {
  allowed: "security:action:allowed",
  blocked: "security:action:blocked",
  confirmationRequested: "security:action:confirmation_requested",
  confirmed: "security:action:confirmed",
  cancelled: "security:action:cancelled",
} as const;

export const ACTION_CONFIRMATION_RISK_LABELS: Record<ActionConfirmationRiskLevel, string> = {
  low: "Baixo",
  medium: "Médio",
  high: "Alto",
};

export const MOCK_OPERATORS: Record<OperatorRole, Operator> = {
  owner: { id: "mock-owner", name: "Platform Owner", role: "owner" },
  admin: { id: "mock-admin", name: "Platform Admin", role: "admin" },
  operator: { id: "mock-operator", name: "Platform Operator", role: "operator" },
  viewer: { id: "mock-viewer", name: "Platform Viewer", role: "viewer" },
};
