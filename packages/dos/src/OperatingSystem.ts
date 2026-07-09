import type { BootOptions, BootResult, HealthReport, PlatformState, ShutdownResult } from "./DOSTypes";
import { Kernel, type KernelOptions } from "./Kernel";
import type { IKernel, IOperatingSystem } from "./interfaces/IKernel";

export class OperatingSystem implements IOperatingSystem {
  readonly kernel: IKernel;

  constructor(options: KernelOptions = {}) {
    this.kernel = new Kernel(options);
  }

  boot(options: BootOptions): BootResult {
    return this.kernel.bootManager.boot(options);
  }

  shutdown(): ShutdownResult {
    return this.kernel.shutdownManager.shutdown();
  }

  getState(): PlatformState {
    return this.kernel.runtime.snapshot(this.kernel.platformStatus.getState());
  }

  getHealthReport(): HealthReport {
    return this.kernel.healthMonitor.run(this.kernel.moduleManager.getRegistry());
  }

  isReady(): boolean {
    const state = this.getState();
    return state.status === "ready" && this.kernel.runtime.isRunning();
  }
}

export function createOperatingSystem(options?: KernelOptions): OperatingSystem {
  return new OperatingSystem(options);
}
