import type { VersionInfo } from "../DOSTypes";

export interface IVersionManager {
  getVersion(): VersionInfo;
  setPlatformVersion(version: string): void;
  setEnvironment(environment: string): void;
}
