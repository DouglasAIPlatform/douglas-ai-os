import { createContext } from "react";
import type { PluginManager } from "./PluginManager";
import type { PluginLoadResult } from "./PluginLoader";
import type { Plugin } from "./Plugin";
import type { PluginFilter, PluginId } from "./PluginTypes";
import type {
  RegisteredAgentEntry,
  RegisteredEventEntry,
  RegisteredMenuEntry,
  RegisteredPermissionEntry,
  RegisteredPluginEntry,
  RegisteredWidgetEntry,
} from "./PluginRegistry";

export interface PluginSystemContextValue {
  manager: PluginManager;
  plugins: Plugin[];
  loadResults: PluginLoadResult[];
  loadErrors: string[];
  getPlugin: (pluginId: PluginId) => Plugin | undefined;
  getRoutes: (pluginId?: PluginId) => RegisteredPluginEntry[];
  getMenus: (pluginId?: PluginId) => RegisteredMenuEntry[];
  getWidgets: (
    pluginId?: PluginId,
    slot?: RegisteredWidgetEntry["widget"]["slot"],
  ) => RegisteredWidgetEntry[];
  getAgents: (pluginId?: PluginId) => RegisteredAgentEntry[];
  getEvents: (pluginId?: PluginId) => RegisteredEventEntry[];
  getPermissions: (pluginId?: PluginId) => RegisteredPermissionEntry[];
}

export const PluginSystemContext = createContext<PluginSystemContextValue | null>(
  null,
);

export type { PluginFilter };
