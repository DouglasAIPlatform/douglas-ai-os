import type {
  BootstrapModuleDefinition,
  BootstrapModuleResult,
} from "../BootstrapTypes";

export interface IBootstrapModuleLoader {
  loadAll(modules: BootstrapModuleDefinition[]): Promise<BootstrapModuleResult[]>;
  loadModule(moduleId: string): Promise<BootstrapModuleResult | undefined>;
  resolveLoadOrder(modules: BootstrapModuleDefinition[]): string[];
}
