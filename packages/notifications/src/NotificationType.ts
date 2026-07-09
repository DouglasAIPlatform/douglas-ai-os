export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "action";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export type NotificationChannel =
  | "in_app"
  | "email"
  | "push"
  | "sms"
  | (string & {});

export type NotificationDomain =
  | "system"
  | "ai"
  | "workflow"
  | "financeiro"
  | "marketing"
  | "calma"
  | "youtube"
  | "crm"
  | (string & {});

export type NotificationStatus = "unread" | "read" | "archived" | "dismissed";

export interface NotificationMetadata {
  sourceId?: string;
  actionHref?: string;
  correlationId?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  channel: NotificationChannel;
  domain: NotificationDomain;
  title: string;
  message: string;
  status: NotificationStatus;
  createdAt: string;
  readAt?: string;
  dismissedAt?: string;
  metadata: NotificationMetadata;
}

export interface NotificationInput {
  type: NotificationType;
  priority?: NotificationPriority;
  channel?: NotificationChannel;
  domain: NotificationDomain;
  title: string;
  message: string;
  metadata?: NotificationMetadata;
}

export interface NotificationFilter {
  type?: NotificationType;
  priority?: NotificationPriority;
  channel?: NotificationChannel;
  domain?: NotificationDomain;
  status?: NotificationStatus;
}

export const NOTIFICATION_DOMAIN_LABELS: Record<string, string> = {
  system: "Sistema",
  ai: "IA",
  workflow: "Workflow",
  financeiro: "Financeiro",
  marketing: "Marketing",
  calma: "Calma",
  youtube: "YouTube",
  crm: "CRM",
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  info: "Informação",
  success: "Sucesso",
  warning: "Aviso",
  error: "Erro",
  action: "Ação",
};

export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

export const NOTIFICATION_CHANNEL_LABELS: Record<string, string> = {
  in_app: "In-App",
  email: "E-mail",
  push: "Push",
  sms: "SMS",
};
