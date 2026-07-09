import type { BootOptions, BootResult } from "../DOSTypes";

export interface IBootManager {
  boot(options: BootOptions): BootResult;
  getLastResult(): BootResult | null;
}
