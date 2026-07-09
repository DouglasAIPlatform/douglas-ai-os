import type { IManagedModule, ModuleLifecycleStatus } from "../DOSTypes";

export interface IModuleRegistry {
  register(module: IManagedModule): void;
  registerMany(modules: IManagedModule[]): void;
  get(id: string): IManagedModule | undefined;
  getAll(): IManagedModule[];
  has(id: string): boolean;
  updateStatus(
    id: string,
    status: ModuleLifecycleStatus,
  ): IManagedModule | undefined;
  size(): number;
  clear(): void;
}
