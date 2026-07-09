import type { PluginRegistry } from "./PluginRegistry";
import type { PluginManifest } from "./PluginManifest";
import type {
  PluginAgentDefinition,
  PluginEventDefinition,
  PluginId,
  PluginMenuDefinition,
  PluginPermissionDefinition,
  PluginRouteDefinition,
  PluginWidgetDefinition,
} from "./PluginTypes";

export class PluginContext {
  constructor(
    public readonly pluginId: PluginId,
    public readonly manifest: PluginManifest,
    private readonly registry: PluginRegistry,
  ) {}

  registerRoute(route: PluginRouteDefinition): void {
    this.registry.registerRoute(this.pluginId, route);
  }

  registerMenu(menu: PluginMenuDefinition): void {
    this.registry.registerMenu(this.pluginId, menu);
  }

  registerWidget(widget: PluginWidgetDefinition): void {
    this.registry.registerWidget(this.pluginId, widget);
  }

  registerAgent(agent: PluginAgentDefinition): void {
    this.registry.registerAgent(this.pluginId, agent);
  }

  registerEvent(event: PluginEventDefinition): void {
    this.registry.registerEvent(this.pluginId, event);
  }

  registerPermission(permission: PluginPermissionDefinition): void {
    this.registry.registerPermission(this.pluginId, permission);
  }

  registerFromManifest(manifest: PluginManifest = this.manifest): void {
    manifest.routes?.forEach((route) => this.registerRoute(route));
    manifest.menus?.forEach((menu) => this.registerMenu(menu));
    manifest.widgets?.forEach((widget) => this.registerWidget(widget));
    manifest.agents?.forEach((agent) => this.registerAgent(agent));
    manifest.events?.forEach((event) => this.registerEvent(event));
    manifest.permissions?.forEach((permission) =>
      this.registerPermission(permission),
    );
  }
}
