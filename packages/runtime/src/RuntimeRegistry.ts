import type {
  RuntimeHealthStatus,
  RuntimeModuleDefinition,
  RuntimeModuleSnapshot,
  RuntimeModuleStatus,
} from "./RuntimeTypes";
import type { IRuntimeRegistry } from "./interfaces/IRuntimeRegistry";

function createInitialSnapshot(module: RuntimeModuleDefinition): RuntimeModuleSnapshot {
  return {
    id: module.id,
    name: module.name,
    version: module.version,
    status: "stopped",
    health: "healthy",
    uptimeMs: 0,
    lastTransitionAt: new Date().toISOString(),
  };
}

export class RuntimeRegistry implements IRuntimeRegistry {
  private modules = new Map<string, RuntimeModuleDefinition>();
  private snapshots = new Map<string, RuntimeModuleSnapshot>();
  private moduleStartedAt = new Map<string, number>();

  registerAll(modules: RuntimeModuleDefinition[]): void {
    this.modules.clear();
    this.snapshots.clear();
    this.moduleStartedAt.clear();

    modules.forEach((module) => {
      this.modules.set(module.id, module);
      this.snapshots.set(module.id, createInitialSnapshot(module));
    });
  }

  getModule(id: string): RuntimeModuleDefinition | undefined {
    return this.modules.get(id);
  }

  getAllModules(): RuntimeModuleDefinition[] {
    return [...this.modules.values()];
  }

  getSnapshot(id: string): RuntimeModuleSnapshot | undefined {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) return undefined;
    return this.withUptime(snapshot);
  }

  getAllSnapshots(): RuntimeModuleSnapshot[] {
    return [...this.snapshots.values()].map((snapshot) => this.withUptime(snapshot));
  }

  updateSnapshot(id: string, patch: Partial<RuntimeModuleSnapshot>): RuntimeModuleSnapshot {
    const current = this.snapshots.get(id);
    if (!current) {
      throw new Error(`Runtime module not registered: ${id}`);
    }

    const nextStatus = patch.status ?? current.status;
    if (patch.status && patch.status !== current.status) {
      this.handleStatusTransition(id, current.status, nextStatus);
    }

    const updated: RuntimeModuleSnapshot = {
      ...current,
      ...patch,
      status: nextStatus,
      lastTransitionAt: patch.status ? new Date().toISOString() : current.lastTransitionAt,
    };

    this.snapshots.set(id, updated);
    return this.withUptime(updated);
  }

  private handleStatusTransition(
    id: string,
    from: RuntimeModuleStatus,
    to: RuntimeModuleStatus,
  ): void {
    if (to === "ready" && from !== "ready") {
      this.moduleStartedAt.set(
        id,
        typeof performance !== "undefined" ? performance.now() : Date.now(),
      );
    }

    if (to === "stopped" || to === "failed") {
      this.moduleStartedAt.delete(id);
    }
  }

  private withUptime(snapshot: RuntimeModuleSnapshot): RuntimeModuleSnapshot {
    if (snapshot.status !== "ready") {
      return { ...snapshot };
    }

    const startedAt = this.moduleStartedAt.get(snapshot.id);
    if (startedAt === undefined) {
      return { ...snapshot };
    }

    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    return {
      ...snapshot,
      uptimeMs: Math.round(now - startedAt),
    };
  }
}

export function resolveRuntimeHealth(
  snapshots: RuntimeModuleSnapshot[],
): RuntimeHealthStatus {
  if (snapshots.some((module) => module.health === "unhealthy" || module.status === "failed")) {
    return "unhealthy";
  }
  if (snapshots.some((module) => module.health === "degraded" || module.status === "paused")) {
    return "degraded";
  }
  return "healthy";
}
