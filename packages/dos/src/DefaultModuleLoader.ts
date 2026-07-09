import type { IManagedModule } from "./DOSTypes";
import type { IEventPublisher } from "./interfaces/IEventPublisher";
import type { ILifecycleManager } from "./interfaces/ILifecycleManager";
import type { IModuleLoader } from "./interfaces/IModuleLoader";
import type { IModuleRegistry } from "./interfaces/IModuleRegistry";
import { DOS_TOPICS } from "./DOSTypes";

export class DefaultModuleLoader implements IModuleLoader {
  constructor(
    private readonly registry: IModuleRegistry,
    private readonly lifecycleManager: ILifecycleManager,
    private readonly eventPublisher?: IEventPublisher,
  ) {}

  loadAll(modules: IManagedModule[]): IManagedModule[] {
    this.registry.registerMany(modules);

    const order = this.resolveLoadOrder(modules);
    const loaded: IManagedModule[] = [];

    order.forEach((moduleId) => {
      const loadedModule = this.loadModule(moduleId);
      if (loadedModule) loaded.push(loadedModule);
    });

    return loaded;
  }

  loadModule(moduleId: string): IManagedModule | undefined {
    const module = this.registry.get(moduleId);
    if (!module) return undefined;

    this.eventPublisher?.publish(DOS_TOPICS.MODULE_LOADING, { moduleId });

    let current = this.transition(module, "loading");
    current = this.transition(current, "loaded");
    current = this.transition(current, "ready");

    this.eventPublisher?.publish(DOS_TOPICS.MODULE_READY, {
      moduleId,
      version: module.version,
    });

    return current;
  }

  resolveLoadOrder(modules: IManagedModule[]): string[] {
    const moduleMap = new Map(modules.map((module) => [module.id, module]));
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (moduleId: string) => {
      if (visited.has(moduleId)) return;
      visited.add(moduleId);

      const module = moduleMap.get(moduleId);
      module?.dependencies.forEach((dependencyId) => visit(dependencyId));

      order.push(moduleId);
    };

    modules.forEach((module) => visit(module.id));
    return order;
  }

  private transition(
    module: IManagedModule,
    status: IManagedModule["status"],
  ): IManagedModule {
    const updated = this.lifecycleManager.transition(module, status);
    this.registry.updateStatus(module.id, updated.status);
    return updated;
  }
}
