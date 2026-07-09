import type { EventBus } from "./EventBus";
import type { Logger } from "./Logger";
import type { ModuleRegistry } from "./ModuleRegistry";
import type { CoreModuleDefinition, CoreModuleId } from "./CoreTypes";
import { CORE_TOPICS } from "./CoreTypes";

export class ModuleLoader {
  constructor(
    private readonly registry: ModuleRegistry,
    private readonly eventBus: EventBus,
    private readonly logger: Logger,
  ) {}

  loadAll(modules: CoreModuleDefinition[]): CoreModuleDefinition[] {
    this.registry.registerMany(modules);

    const order = this.resolveLoadOrder(modules);
    const loaded: CoreModuleDefinition[] = [];

    order.forEach((moduleId) => {
      const loadedModule = this.loadModule(moduleId);
      if (loadedModule) loaded.push(loadedModule);
    });

    return loaded;
  }

  loadModule(moduleId: CoreModuleId): CoreModuleDefinition | undefined {
    const module = this.registry.get(moduleId);
    if (!module) return undefined;

    this.registry.updateStatus(moduleId, "loading");
    this.eventBus.publish(CORE_TOPICS.MODULE_LOADING, "core", {
      moduleId,
    });
    this.logger.info(`Loading module: ${module.name}`, { moduleId });

    this.registry.updateStatus(moduleId, "loaded");
    this.eventBus.publish(CORE_TOPICS.MODULE_LOADED, "core", { moduleId });

    const ready = this.registry.updateStatus(moduleId, "ready");
    if (ready) {
      this.eventBus.publish(CORE_TOPICS.MODULE_READY, moduleId, {
        moduleId,
        version: module.version,
      });
      this.logger.info(`Module ready: ${module.name}`, { moduleId });
    }

    return ready;
  }

  resolveLoadOrder(modules: CoreModuleDefinition[]): CoreModuleId[] {
    const moduleMap = new Map(modules.map((module) => [module.id, module]));
    const visited = new Set<CoreModuleId>();
    const order: CoreModuleId[] = [];

    const visit = (moduleId: CoreModuleId) => {
      if (visited.has(moduleId)) return;
      visited.add(moduleId);

      const module = moduleMap.get(moduleId);
      module?.dependencies.forEach((dependencyId) => visit(dependencyId));

      order.push(moduleId);
    };

    modules.forEach((module) => visit(module.id));
    return order;
  }
}
