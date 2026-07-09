import type { IManagedModule, ModuleLifecycleStatus } from "../DOSTypes";

export interface IModuleManager {
  register(modules: IManagedModule[]): void;
  loadAll(): IManagedModule[];
  loadModule(moduleId: string): IManagedModule | undefined;
  getModule(moduleId: string): IManagedModule | undefined;
  getAllModules(): IManagedModule[];
  getReadyModules(): IManagedModule[];
  updateStatus(
    moduleId: string,
    status: ModuleLifecycleStatus,
  ): IManagedModule | undefined;
  getRegistry(): import("./IModuleRegistry").IModuleRegistry;
}
