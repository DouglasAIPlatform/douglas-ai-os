import type { IManagedModule, ModuleLifecycleStatus } from "./DOSTypes";
import type { IModuleRegistry } from "./interfaces/IModuleRegistry";

export class InMemoryModuleRegistry implements IModuleRegistry {
  private modules = new Map<string, IManagedModule>();

  register(module: IManagedModule): void {
    this.modules.set(module.id, module);
  }

  registerMany(modules: IManagedModule[]): void {
    modules.forEach((module) => this.register(module));
  }

  get(id: string): IManagedModule | undefined {
    return this.modules.get(id);
  }

  getAll(): IManagedModule[] {
    return Array.from(this.modules.values());
  }

  has(id: string): boolean {
    return this.modules.has(id);
  }

  updateStatus(
    id: string,
    status: ModuleLifecycleStatus,
  ): IManagedModule | undefined {
    const current = this.modules.get(id);
    if (!current) return undefined;

    const updated = { ...current, status };
    this.modules.set(id, updated);
    return updated;
  }

  size(): number {
    return this.modules.size;
  }

  clear(): void {
    this.modules.clear();
  }
}
