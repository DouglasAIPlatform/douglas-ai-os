import { RuntimeManager, type RuntimeManagerOptions } from "./RuntimeManager";
import type { RuntimeStartOptions } from "./RuntimeTypes";

export class PlatformRuntime {
  private readonly manager: RuntimeManager;

  constructor(options: RuntimeManagerOptions = {}) {
    this.manager = new RuntimeManager(options);
  }

  async start(options: RuntimeStartOptions): Promise<void> {
    return this.manager.start(options);
  }

  async stop() {
    return this.manager.stop();
  }

  getManager(): RuntimeManager {
    return this.manager;
  }
}

export function createPlatformRuntime(options?: RuntimeManagerOptions): PlatformRuntime {
  return new PlatformRuntime(options);
}
