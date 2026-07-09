import type { IManagedModule, IPluginManifestContract } from "@douglas/dos";
import { coreModuleDefinitions } from "../core/modules";
import {
  calmaPlugin,
  crmPlugin,
  youtubeStudioPlugin,
} from "../plugins/manifests";

export const dosManagedModules: IManagedModule[] = coreModuleDefinitions.map(
  (module) => ({
    id: module.id,
    name: module.name,
    description: module.description,
    version: module.version,
    dependencies: [...module.dependencies],
    status: "registered",
    packageName: module.packageName,
  }),
);

export const dosPluginManifests: IPluginManifestContract[] = [
  calmaPlugin.manifest,
  youtubeStudioPlugin.manifest,
  crmPlugin.manifest,
];

export const dosBootOptions = {
  modules: dosManagedModules,
  plugins: dosPluginManifests,
};
