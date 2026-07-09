import type { IPluginManifestContract } from "../DOSTypes";

export interface IPluginValidator {
  validate(manifest: IPluginManifestContract): string[];
  validateAll(manifests: IPluginManifestContract[]): Map<string, string[]>;
}

export interface IPluginRegistry {
  register(manifest: IPluginManifestContract): void;
  recordRejection(manifest: IPluginManifestContract, errors: string[]): void;
  get(id: string): IPluginManifestContract | undefined;
  getAll(): IPluginManifestContract[];
  getValidated(): IPluginManifestContract[];
  getRejected(): Array<{ manifest: IPluginManifestContract; errors: string[] }>;
  clear(): void;
}
