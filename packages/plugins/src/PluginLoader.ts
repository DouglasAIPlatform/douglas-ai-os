import { PluginContext } from "./PluginContext";
import type { Plugin } from "./Plugin";
import type { PluginRegistry } from "./PluginRegistry";
import type { PluginId } from "./PluginTypes";

export interface PluginLoadResult {
  plugin: Plugin;
  context: PluginContext;
  errors: string[];
}

export class PluginLoader {
  constructor(private readonly registry: PluginRegistry) {}

  loadAll(plugins: Plugin[]): PluginLoadResult[] {
    plugins.forEach((plugin) => this.registry.registerPlugin(plugin));

    const order = this.resolveLoadOrder(plugins);
    return order
      .map((pluginId) => this.loadPlugin(pluginId))
      .filter((result): result is PluginLoadResult => result !== undefined);
  }

  loadPlugin(pluginId: PluginId): PluginLoadResult | undefined {
    const plugin = this.registry.getPlugin(pluginId);
    if (!plugin) return undefined;

    const errors: string[] = [];
    this.registry.updateStatus(pluginId, "loading");

    const context = new PluginContext(pluginId, plugin.manifest, this.registry);

    try {
      context.registerFromManifest();
      plugin.setup?.(context);
      this.registry.updateStatus(pluginId, "loaded");
      this.registry.updateStatus(pluginId, "ready");
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : "Unknown plugin load error.",
      );
      this.registry.updateStatus(pluginId, "error");
    }

    const loaded = this.registry.getPlugin(pluginId);
    if (!loaded) return undefined;

    return { plugin: loaded, context, errors };
  }

  resolveLoadOrder(plugins: Plugin[]): PluginId[] {
    const pluginMap = new Map(plugins.map((plugin) => [plugin.id, plugin]));
    const visited = new Set<PluginId>();
    const order: PluginId[] = [];

    const visit = (pluginId: PluginId) => {
      if (visited.has(pluginId)) return;
      visited.add(pluginId);

      const plugin = pluginMap.get(pluginId);
      plugin?.manifest.dependencies?.forEach((dependencyId) =>
        visit(dependencyId),
      );

      order.push(pluginId);
    };

    plugins.forEach((plugin) => visit(plugin.id));
    return order;
  }
}
