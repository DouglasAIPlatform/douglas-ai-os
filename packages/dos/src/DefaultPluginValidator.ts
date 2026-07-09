import type { IPluginManifestContract } from "./DOSTypes";
import type { IPluginRegistry, IPluginValidator } from "./interfaces/IPluginValidator";

export class DefaultPluginValidator implements IPluginValidator {
  validate(manifest: IPluginManifestContract): string[] {
    const errors: string[] = [];

    if (!manifest.id) errors.push("Plugin manifest requires id.");
    if (!manifest.name) errors.push("Plugin manifest requires name.");
    if (!manifest.version) errors.push("Plugin manifest requires version.");

    const routeIds = new Set(manifest.routes?.map((route) => route.id) ?? []);

    manifest.menus?.forEach((menu) => {
      if (!routeIds.has(menu.routeId)) {
        errors.push(
          `Menu "${menu.id}" references unknown route "${menu.routeId}".`,
        );
      }
    });

    return errors;
  }

  validateAll(manifests: IPluginManifestContract[]): Map<string, string[]> {
    const results = new Map<string, string[]>();

    manifests.forEach((manifest) => {
      results.set(manifest.id, this.validate(manifest));
    });

    return results;
  }
}

export class InMemoryPluginRegistry implements IPluginRegistry {
  private validated = new Map<string, IPluginManifestContract>();
  private rejected: Array<{
    manifest: IPluginManifestContract;
    errors: string[];
  }> = [];

  register(manifest: IPluginManifestContract): void {
    this.validated.set(manifest.id, manifest);
  }

  recordRejection(manifest: IPluginManifestContract, errors: string[]): void {
    this.rejected.push({ manifest, errors });
  }

  get(id: string): IPluginManifestContract | undefined {
    return this.validated.get(id);
  }

  getAll(): IPluginManifestContract[] {
    return Array.from(this.validated.values());
  }

  getValidated(): IPluginManifestContract[] {
    return this.getAll();
  }

  getRejected(): Array<{ manifest: IPluginManifestContract; errors: string[] }> {
    return [...this.rejected];
  }

  clear(): void {
    this.validated.clear();
    this.rejected = [];
  }
}
