export type PluginId =
  | "calma"
  | "youtube-studio"
  | "crm"
  | (string & {});

export type PluginStatus =
  | "registered"
  | "loading"
  | "loaded"
  | "ready"
  | "disabled"
  | "error";

export type PluginWidgetSlot =
  | "dashboard"
  | "sidebar"
  | "header"
  | "workspace"
  | (string & {});

export type PluginPermissionScope =
  | "read"
  | "write"
  | "execute"
  | "admin"
  | (string & {});

export type PluginMenuSection =
  | "workspace"
  | "products"
  | "account"
  | (string & {});

export interface PluginRouteDefinition {
  id: string;
  path: string;
  title: string;
  label: string;
  subtitle?: string;
  order?: number;
  componentId?: string;
  keywords?: string[];
}

export interface PluginMenuDefinition {
  id: string;
  label: string;
  section: PluginMenuSection;
  routeId: string;
  order?: number;
  iconId?: string;
  keywords?: string[];
}

export interface PluginWidgetDefinition {
  id: string;
  name: string;
  description?: string;
  slot: PluginWidgetSlot;
  order?: number;
  componentId?: string;
}

export interface PluginAgentDefinition {
  id: string;
  name: string;
  description: string;
  department?: string;
  capabilities: string[];
  permissions: string[];
}

export interface PluginEventDefinition {
  topic: string;
  description: string;
  publishers: string[];
  subscribers: string[];
}

export interface PluginPermissionDefinition {
  id: string;
  label: string;
  description: string;
  scope: PluginPermissionScope;
}

export interface PluginMetadata {
  author?: string;
  homepage?: string;
  repository?: string;
  tags?: string[];
  [key: string]: string | string[] | number | boolean | null | undefined;
}

export interface PluginFilter {
  status?: PluginStatus;
  tag?: string;
}

export const PLUGIN_PRODUCT_LABELS: Record<string, string> = {
  calma: "Calma",
  "youtube-studio": "YouTube Studio",
  crm: "CRM",
};

export const PLUGIN_STATUS_LABELS: Record<PluginStatus, string> = {
  registered: "Registrado",
  loading: "Carregando",
  loaded: "Carregado",
  ready: "Pronto",
  disabled: "Desabilitado",
  error: "Erro",
};

export const PLUGIN_WIDGET_SLOT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  sidebar: "Sidebar",
  header: "Header",
  workspace: "Workspace",
};
