"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { PluginManager } from "./PluginManager";
import type { Plugin } from "./Plugin";
import { PluginSystemContext } from "./PluginSystemContext";

export interface PluginProviderProps {
  children: ReactNode;
  plugins?: Plugin[];
  manager?: PluginManager;
}

export function PluginProvider({
  children,
  plugins = [],
  manager: externalManager,
}: PluginProviderProps) {
  const { manager, loadResults } = useMemo(() => {
    const nextManager = externalManager ?? new PluginManager();
    const results = plugins.length ? nextManager.register(plugins) : [];
    return { manager: nextManager, loadResults: results };
  }, [externalManager, plugins]);

  const value = useMemo(
    () => ({
      manager,
      plugins: manager.getAllPlugins(),
      loadResults,
      loadErrors: manager.getLoadErrors(),
      getPlugin: (pluginId: Plugin["id"]) => manager.getPlugin(pluginId),
      getRoutes: (pluginId?: Plugin["id"]) => manager.getRoutes(pluginId),
      getMenus: (pluginId?: Plugin["id"]) => manager.getMenus(pluginId),
      getWidgets: (pluginId?: Plugin["id"], slot?: Parameters<PluginManager["getWidgets"]>[1]) =>
        manager.getWidgets(pluginId, slot),
      getAgents: (pluginId?: Plugin["id"]) => manager.getAgents(pluginId),
      getEvents: (pluginId?: Plugin["id"]) => manager.getEvents(pluginId),
      getPermissions: (pluginId?: Plugin["id"]) =>
        manager.getPermissions(pluginId),
    }),
    [loadResults, manager],
  );

  return (
    <PluginSystemContext.Provider value={value}>
      {children}
    </PluginSystemContext.Provider>
  );
}
