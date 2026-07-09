import type {
  IManagedModule,
  ModuleLifecycleStatus,
} from "./DOSTypes";
import type { ILifecycleManager } from "./interfaces/ILifecycleManager";
import type { IModuleLoader } from "./interfaces/IModuleLoader";
import type { IModuleManager } from "./interfaces/IModuleManager";
import type { IModuleRegistry } from "./interfaces/IModuleRegistry";

export class ModuleManager implements IModuleManager {
  constructor(
    private readonly registry: IModuleRegistry,
    private readonly loader: IModuleLoader,
  ) {}

  register(modules: IManagedModule[]): void {
    this.registry.registerMany(modules);
  }

  loadAll(): IManagedModule[] {
    return this.loader.loadAll(this.registry.getAll());
  }

  loadModule(moduleId: string): IManagedModule | undefined {
    return this.loader.loadModule(moduleId);
  }

  getModule(moduleId: string): IManagedModule | undefined {
    return this.registry.get(moduleId);
  }

  getAllModules(): IManagedModule[] {
    return this.registry.getAll();
  }

  getReadyModules(): IManagedModule[] {
    return this.registry.getAll().filter((module) => module.status === "ready");
  }

  updateStatus(
    moduleId: string,
    status: ModuleLifecycleStatus,
  ): IManagedModule | undefined {
    return this.registry.updateStatus(moduleId, status);
  }

  getRegistry(): IModuleRegistry {
    return this.registry;
  }
}
