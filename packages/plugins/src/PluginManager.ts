import { PluginLoader } from "./PluginLoader";
import { PluginRegistry } from "./PluginRegistry";
import type { Plugin } from "./Plugin";
import type { PluginLoadResult } from "./PluginLoader";
import type {
  PluginAgentDefinition,
  PluginEventDefinition,
  PluginFilter,
  PluginId,
  PluginMenuDefinition,
  PluginPermissionDefinition,
  PluginRouteDefinition,
  PluginWidgetDefinition,
} from "./PluginTypes";
import type {
  RegisteredAgentEntry,
  RegisteredEventEntry,
  RegisteredMenuEntry,
  RegisteredPermissionEntry,
  RegisteredPluginEntry,
  RegisteredWidgetEntry,
} from "./PluginRegistry";

export class PluginManager {
  private readonly registry: PluginRegistry;
  private readonly loader: PluginLoader;
  private loadResults: PluginLoadResult[] = [];

  constructor(registry = new PluginRegistry()) {
    this.registry = registry;
    this.loader = new PluginLoader(registry);
  }

  register(plugins: Plugin[]): PluginLoadResult[] {
    this.loadResults = this.loader.loadAll(plugins);
    return this.loadResults;
  }

  getRegistry(): PluginRegistry {
    return this.registry;
  }

  getPlugin(pluginId: PluginId): Plugin | undefined {
    return this.registry.getPlugin(pluginId);
  }

  getAllPlugins(filter?: PluginFilter): Plugin[] {
    return this.registry.getAllPlugins(filter);
  }

  getReadyPlugins(): Plugin[] {
    return this.registry.getAllPlugins({ status: "ready" });
  }

  getRoutes(pluginId?: PluginId): RegisteredPluginEntry[] {
    return this.registry.getRoutes(pluginId);
  }

  getMenus(pluginId?: PluginId): RegisteredMenuEntry[] {
    return this.registry.getMenus(pluginId);
  }

  getWidgets(
    pluginId?: PluginId,
    slot?: PluginWidgetDefinition["slot"],
  ): RegisteredWidgetEntry[] {
    return this.registry.getWidgets(pluginId, slot);
  }

  getAgents(pluginId?: PluginId): RegisteredAgentEntry[] {
    return this.registry.getAgents(pluginId);
  }

  getEvents(pluginId?: PluginId): RegisteredEventEntry[] {
    return this.registry.getEvents(pluginId);
  }

  getPermissions(pluginId?: PluginId): RegisteredPermissionEntry[] {
    return this.registry.getPermissions(pluginId);
  }

  getLoadResults(): PluginLoadResult[] {
    return [...this.loadResults];
  }

  getLoadErrors(): string[] {
    return this.loadResults.flatMap((result) => result.errors);
  }

  clear(): void {
    this.registry.clear();
    this.loadResults = [];
  }
}

export type {
  PluginRouteDefinition,
  PluginMenuDefinition,
  PluginWidgetDefinition,
  PluginAgentDefinition,
  PluginEventDefinition,
  PluginPermissionDefinition,
};
