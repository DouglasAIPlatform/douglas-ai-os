import type {
  PluginAgentDefinition,
  PluginEventDefinition,
  PluginId,
  PluginMenuDefinition,
  PluginMetadata,
  PluginPermissionDefinition,
  PluginRouteDefinition,
  PluginWidgetDefinition,
} from "./PluginTypes";

export interface PluginManifest {
  id: PluginId;
  name: string;
  description: string;
  version: string;
  packageName?: string;
  dependencies?: PluginId[];
  routes?: PluginRouteDefinition[];
  menus?: PluginMenuDefinition[];
  widgets?: PluginWidgetDefinition[];
  agents?: PluginAgentDefinition[];
  events?: PluginEventDefinition[];
  permissions?: PluginPermissionDefinition[];
  metadata?: PluginMetadata;
}

export function createPluginManifest(
  manifest: PluginManifest,
): PluginManifest {
  return {
    routes: [],
    menus: [],
    widgets: [],
    agents: [],
    events: [],
    permissions: [],
    dependencies: [],
    metadata: {},
    ...manifest,
  };
}

export function validatePluginManifest(manifest: PluginManifest): string[] {
  const errors: string[] = [];

  if (!manifest.id) errors.push("Plugin manifest requires id.");
  if (!manifest.name) errors.push("Plugin manifest requires name.");
  if (!manifest.version) errors.push("Plugin manifest requires version.");

  const routeIds = new Set(manifest.routes?.map((route) => route.id) ?? []);

  manifest.menus?.forEach((menu) => {
    if (!routeIds.has(menu.routeId)) {
      errors.push(`Menu "${menu.id}" references unknown route "${menu.routeId}".`);
    }
  });

  return errors;
}
