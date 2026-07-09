import type { VersionInfo } from "./DOSTypes";
import type { IVersionManager } from "./interfaces/IVersionManager";

export const DOS_VERSION = "0.1.0";
export const KERNEL_VERSION = "0.1.0";

export class VersionManager implements IVersionManager {
  private platformVersion = "0.1.0";
  private environment = "development";

  getVersion(): VersionInfo {
    return {
      platform: this.platformVersion,
      dos: DOS_VERSION,
      kernel: KERNEL_VERSION,
      environment: this.environment,
    };
  }

  setPlatformVersion(version: string): void {
    this.platformVersion = version;
  }

  setEnvironment(environment: string): void {
    this.environment = environment;
  }
}
