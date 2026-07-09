import { BootstrapManager, type BootstrapManagerOptions } from "./BootstrapManager";
import type { BootstrapOptions, StartupReport } from "./BootstrapTypes";
import type { IBootstrapManager } from "./interfaces/IBootstrapManager";

export class PlatformBootstrap {
  private readonly manager: IBootstrapManager;

  constructor(options: BootstrapManagerOptions = {}) {
    this.manager = new BootstrapManager(options);
  }

  boot(options: BootstrapOptions): Promise<StartupReport> {
    return this.manager.boot(options);
  }

  getManager(): IBootstrapManager {
    return this.manager;
  }

  getState() {
    return this.manager.getState();
  }

  getHealth() {
    return this.manager.getHealth();
  }

  isReady() {
    return this.manager.isReady();
  }
}

export function createPlatformBootstrap(
  options?: BootstrapManagerOptions,
): PlatformBootstrap {
  return new PlatformBootstrap(options);
}
