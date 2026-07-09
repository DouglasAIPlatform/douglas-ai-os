import type { IRuntimeLifecycle } from "./interfaces/IRuntimeLifecycle";
import { RUNTIME_TRANSITIONS } from "./interfaces/IRuntimeLifecycle";
import type { RuntimeModuleStatus } from "./RuntimeTypes";

export class RuntimeLifecycle implements IRuntimeLifecycle {
  canTransition(from: RuntimeModuleStatus, to: RuntimeModuleStatus): boolean {
    return RUNTIME_TRANSITIONS[from]?.includes(to) ?? false;
  }

  assertTransition(from: RuntimeModuleStatus, to: RuntimeModuleStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(`Invalid runtime transition: ${from} → ${to}`);
    }
  }
}
