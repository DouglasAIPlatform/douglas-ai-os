import type {
  BootstrapModuleDefinition,
  BootstrapModuleResult,
} from "./BootstrapTypes";
import type { IBootstrapModuleLoader } from "./interfaces/IBootstrapModuleLoader";

async function runLoad(
  module: BootstrapModuleDefinition,
): Promise<BootstrapModuleResult> {
  const start = typeof performance !== "undefined" ? performance.now() : Date.now();

  try {
    const result = await module.load();
    const elapsed =
      typeof performance !== "undefined" ? performance.now() - start : Date.now() - start;

    return {
      ...result,
      id: module.id,
      name: result.name || module.name,
      version: result.version || module.version,
      initTimeMs: result.initTimeMs ?? Math.round(elapsed),
    };
  } catch (error) {
    const elapsed =
      typeof performance !== "undefined" ? performance.now() - start : Date.now() - start;

    return {
      id: module.id,
      name: module.name,
      version: module.version,
      status: "failed",
      initTimeMs: Math.round(elapsed),
      health: "unhealthy",
      message: error instanceof Error ? error.message : "Boot failed.",
    };
  }
}

export class ModuleLoader implements IBootstrapModuleLoader {
  private moduleMap = new Map<string, BootstrapModuleDefinition>();

  async loadAll(modules: BootstrapModuleDefinition[]): Promise<BootstrapModuleResult[]> {
    this.moduleMap = new Map(modules.map((module) => [module.id, module]));
    const order = this.resolveLoadOrder(modules);
    const results: BootstrapModuleResult[] = [];

    for (const moduleId of order) {
      const result = await this.loadModule(moduleId);
      if (result) results.push(result);
    }

    return results;
  }

  async loadModule(moduleId: string): Promise<BootstrapModuleResult | undefined> {
    const module = this.moduleMap.get(moduleId);
    if (!module) return undefined;
    return runLoad(module);
  }

  resolveLoadOrder(modules: BootstrapModuleDefinition[]): string[] {
    const moduleMap = new Map(modules.map((module) => [module.id, module]));
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (moduleId: string) => {
      if (visited.has(moduleId)) return;
      visited.add(moduleId);

      const module = moduleMap.get(moduleId);
      module?.dependencies?.forEach((dependencyId) => visit(dependencyId));
      order.push(moduleId);
    };

    modules.forEach((module) => visit(module.id));
    return order;
  }
}
