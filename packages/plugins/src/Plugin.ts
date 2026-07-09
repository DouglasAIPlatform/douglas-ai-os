import type { PluginManifest } from "./PluginManifest";
import type { PluginId, PluginStatus } from "./PluginTypes";

export interface PluginSetupHook {
  (context: import("./PluginContext").PluginContext): void | Promise<void>;
}

export class Plugin {
  constructor(
    public readonly manifest: PluginManifest,
    public status: PluginStatus = "registered",
    public readonly setup?: PluginSetupHook,
  ) {}

  get id(): PluginId {
    return this.manifest.id;
  }

  get name(): string {
    return this.manifest.name;
  }

  get version(): string {
    return this.manifest.version;
  }

  withStatus(status: PluginStatus): Plugin {
    return new Plugin(this.manifest, status, this.setup);
  }
}

export function createPlugin(
  manifest: PluginManifest,
  setup?: PluginSetupHook,
): Plugin {
  return new Plugin(manifest, "registered", setup);
}
