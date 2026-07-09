import type { Plugin } from "./Plugin";
import type {
  PluginAgentDefinition,
  PluginEventDefinition,
  PluginFilter,
  PluginId,
  PluginMenuDefinition,
  PluginPermissionDefinition,
  PluginRouteDefinition,
  PluginStatus,
  PluginWidgetDefinition,
} from "./PluginTypes";

export interface RegisteredPluginEntry {
  pluginId: PluginId;
  route: PluginRouteDefinition;
}

export interface RegisteredMenuEntry {
  pluginId: PluginId;
  menu: PluginMenuDefinition;
}

export interface RegisteredWidgetEntry {
  pluginId: PluginId;
  widget: PluginWidgetDefinition;
}

export interface RegisteredAgentEntry {
  pluginId: PluginId;
  agent: PluginAgentDefinition;
}

export interface RegisteredEventEntry {
  pluginId: PluginId;
  event: PluginEventDefinition;
}

export interface RegisteredPermissionEntry {
  pluginId: PluginId;
  permission: PluginPermissionDefinition;
}

function matchesFilter(plugin: Plugin, filter: PluginFilter = {}): boolean {
  if (filter.status && plugin.status !== filter.status) return false;
  if (filter.tag) {
    const tags = plugin.manifest.metadata?.tags ?? [];
    if (!tags.includes(filter.tag)) return false;
  }
  return true;
}

export class PluginRegistry {
  private plugins = new Map<PluginId, Plugin>();
  private routes = new Map<string, RegisteredPluginEntry>();
  private menus = new Map<string, RegisteredMenuEntry>();
  private widgets = new Map<string, RegisteredWidgetEntry>();
  private agents = new Map<string, RegisteredAgentEntry>();
  private events = new Map<string, RegisteredEventEntry>();
  private permissions = new Map<string, RegisteredPermissionEntry>();

  registerPlugin(plugin: Plugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  registerRoute(pluginId: PluginId, route: PluginRouteDefinition): void {
    this.routes.set(`${pluginId}:${route.id}`, { pluginId, route });
  }

  registerMenu(pluginId: PluginId, menu: PluginMenuDefinition): void {
    this.menus.set(`${pluginId}:${menu.id}`, { pluginId, menu });
  }

  registerWidget(pluginId: PluginId, widget: PluginWidgetDefinition): void {
    this.widgets.set(`${pluginId}:${widget.id}`, { pluginId, widget });
  }

  registerAgent(pluginId: PluginId, agent: PluginAgentDefinition): void {
    this.agents.set(`${pluginId}:${agent.id}`, { pluginId, agent });
  }

  registerEvent(pluginId: PluginId, event: PluginEventDefinition): void {
    this.events.set(`${pluginId}:${event.topic}`, { pluginId, event });
  }

  registerPermission(
    pluginId: PluginId,
    permission: PluginPermissionDefinition,
  ): void {
    this.permissions.set(`${pluginId}:${permission.id}`, { pluginId, permission });
  }

  getPlugin(pluginId: PluginId): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  getAllPlugins(filter?: PluginFilter): Plugin[] {
    return Array.from(this.plugins.values()).filter((plugin) =>
      matchesFilter(plugin, filter),
    );
  }

  getRoutes(pluginId?: PluginId): RegisteredPluginEntry[] {
    return this.filterByPlugin(this.routes, pluginId).sort(
      (a, b) => (a.route.order ?? 0) - (b.route.order ?? 0),
    );
  }

  getMenus(pluginId?: PluginId): RegisteredMenuEntry[] {
    return this.filterByPlugin(this.menus, pluginId).sort(
      (a, b) => (a.menu.order ?? 0) - (b.menu.order ?? 0),
    );
  }

  getWidgets(pluginId?: PluginId, slot?: PluginWidgetDefinition["slot"]): RegisteredWidgetEntry[] {
    return this.filterByPlugin(this.widgets, pluginId)
      .filter((entry) => !slot || entry.widget.slot === slot)
      .sort((a, b) => (a.widget.order ?? 0) - (b.widget.order ?? 0));
  }

  getAgents(pluginId?: PluginId): RegisteredAgentEntry[] {
    return this.filterByPlugin(this.agents, pluginId);
  }

  getEvents(pluginId?: PluginId): RegisteredEventEntry[] {
    return this.filterByPlugin(this.events, pluginId);
  }

  getPermissions(pluginId?: PluginId): RegisteredPermissionEntry[] {
    return this.filterByPlugin(this.permissions, pluginId);
  }

  updateStatus(
    pluginId: PluginId,
    status: PluginStatus,
  ): Plugin | undefined {
    const current = this.plugins.get(pluginId);
    if (!current) return undefined;

    const updated = current.withStatus(status);
    this.plugins.set(pluginId, updated);
    return updated;
  }

  has(pluginId: PluginId): boolean {
    return this.plugins.has(pluginId);
  }

  size(): number {
    return this.plugins.size;
  }

  clear(): void {
    this.plugins.clear();
    this.routes.clear();
    this.menus.clear();
    this.widgets.clear();
    this.agents.clear();
    this.events.clear();
    this.permissions.clear();
  }

  private filterByPlugin<T extends { pluginId: PluginId }>(
    collection: Map<string, T>,
    pluginId?: PluginId,
  ): T[] {
    return Array.from(collection.values()).filter(
      (entry) => !pluginId || entry.pluginId === pluginId,
    );
  }
}
