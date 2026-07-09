import type { IRuntimeManager } from "./interfaces/IRuntimeManager";
import type { RuntimeActionType } from "./RuntimeControlTypes";

export interface IRuntimeCommandHandler {
  execute(moduleId: string, action: RuntimeActionType): Promise<void>;
}

export class RuntimeCommandHandler implements IRuntimeCommandHandler {
  constructor(private readonly manager: IRuntimeManager) {}

  async execute(moduleId: string, action: RuntimeActionType): Promise<void> {
    switch (action) {
      case "refresh_module":
        await this.manager.refreshModule(moduleId);
        return;
      case "pause_module":
        await this.manager.pauseModule(moduleId);
        return;
      case "resume_module":
        await this.manager.resumeModule(moduleId);
        return;
      case "restart_module":
        await this.manager.restartModule(moduleId);
        return;
      case "run_health_check":
        await this.manager.runHealthCheck(moduleId);
        return;
      default:
        throw new Error(`Unsupported runtime action: ${action}`);
    }
  }
}
