import type { CoreModuleDefinition, CoreModuleId } from "./CoreTypes";

export class ModuleRegistry {
  private modules = new Map<CoreModuleId, CoreModuleDefinition>();

  register(module: CoreModuleDefinition): void {
    this.modules.set(module.id, module);
  }

  registerMany(modules: CoreModuleDefinition[]): void {
    modules.forEach((module) => this.register(module));
  }

  unregister(moduleId: CoreModuleId): boolean {
    return this.modules.delete(moduleId);
  }

  get(moduleId: CoreModuleId): CoreModuleDefinition | undefined {
    return this.modules.get(moduleId);
  }

  has(moduleId: CoreModuleId): boolean {
    return this.modules.has(moduleId);
  }

  getAll(): CoreModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  updateStatus(
    moduleId: CoreModuleId,
    status: CoreModuleDefinition["status"],
  ): CoreModuleDefinition | undefined {
    const current = this.modules.get(moduleId);
    if (!current) return undefined;

    const updated = { ...current, status };
    this.modules.set(moduleId, updated);
    return updated;
  }

  size(): number {
    return this.modules.size;
  }

  clear(): void {
    this.modules.clear();
  }
}
