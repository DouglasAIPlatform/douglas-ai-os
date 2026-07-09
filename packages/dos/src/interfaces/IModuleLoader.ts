import type { IManagedModule } from "../DOSTypes";

export interface IModuleLoader {
  loadAll(modules: IManagedModule[]): IManagedModule[];
  loadModule(moduleId: string): IManagedModule | undefined;
  resolveLoadOrder(modules: IManagedModule[]): string[];
}
