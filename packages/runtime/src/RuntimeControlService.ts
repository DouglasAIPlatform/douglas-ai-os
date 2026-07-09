import type { IRuntimeManager } from "./interfaces/IRuntimeManager";
import { RuntimeCommandHandler } from "./RuntimeCommandHandler";
import { RuntimeControlPanel } from "./RuntimeControlPanel";
import type {
  RuntimeAction,
  RuntimeActionEventPayload,
  RuntimeActionResult,
  RuntimeActionType,
  RuntimeCommand,
} from "./RuntimeControlTypes";
import {
  RUNTIME_ACTION_LABELS,
  RUNTIME_ACTION_TOPICS,
} from "./RuntimeControlTypes";
import type { RuntimeModuleSnapshot } from "./RuntimeTypes";

export interface RuntimeControlServiceOptions {
  manager: IRuntimeManager;
  publish?: (topic: string, payload: RuntimeActionEventPayload) => void;
  panel?: RuntimeControlPanel;
  handler?: RuntimeCommandHandler;
}

function createCommandId(): string {
  return `rcmd:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

export class RuntimeControlService {
  private readonly manager: IRuntimeManager;
  private readonly publish: (topic: string, payload: RuntimeActionEventPayload) => void;
  private readonly panel: RuntimeControlPanel;
  private readonly handler: RuntimeCommandHandler;

  constructor(options: RuntimeControlServiceOptions) {
    this.manager = options.manager;
    this.publish = options.publish ?? (() => undefined);
    this.panel = options.panel ?? new RuntimeControlPanel();
    this.handler = options.handler ?? new RuntimeCommandHandler(this.manager);
  }

  getPanel(): RuntimeControlPanel {
    return this.panel;
  }

  getAvailableActions(module: RuntimeModuleSnapshot): RuntimeAction[] {
    const actions: RuntimeActionType[] = [
      "refresh_module",
      "run_health_check",
      "pause_module",
      "resume_module",
      "restart_module",
    ];

    return actions.map((type) => {
      const enabled = this.isActionEnabled(module, type);
      return {
        type,
        moduleId: module.id,
        label: RUNTIME_ACTION_LABELS[type],
        enabled,
        reason: enabled ? undefined : this.disabledReason(module, type),
      };
    });
  }

  async execute(moduleId: string, action: RuntimeActionType): Promise<RuntimeActionResult> {
    const command: RuntimeCommand = {
      id: createCommandId(),
      moduleId,
      action,
      requestedAt: new Date().toISOString(),
      requestedBy: "runtime-control",
    };

    this.panel.recordCommand(command);

    const startedPayload: RuntimeActionEventPayload = {
      commandId: command.id,
      moduleId,
      action,
      message: `${RUNTIME_ACTION_LABELS[action]} started`,
    };

    this.publish(RUNTIME_ACTION_TOPICS.started, startedPayload);

    const start = typeof performance !== "undefined" ? performance.now() : Date.now();

    try {
      await this.handler.execute(moduleId, action);

      const snapshot = this.manager.getState().modules.find((module) => module.id === moduleId);
      const durationMs = Math.round(
        (typeof performance !== "undefined" ? performance.now() : Date.now()) - start,
      );

      const result: RuntimeActionResult = {
        commandId: command.id,
        moduleId,
        action,
        success: true,
        message: `${RUNTIME_ACTION_LABELS[action]} completed (simulated)`,
        durationMs,
        completedAt: new Date().toISOString(),
        moduleStatusAfter: snapshot?.status,
        healthAfter: snapshot?.health,
      };

      this.panel.recordResult(result);
      this.publish(RUNTIME_ACTION_TOPICS.completed, {
        ...startedPayload,
        success: true,
        durationMs,
        message: result.message,
      });

      return result;
    } catch (error) {
      const durationMs = Math.round(
        (typeof performance !== "undefined" ? performance.now() : Date.now()) - start,
      );
      const message = error instanceof Error ? error.message : "Runtime action failed";

      const result: RuntimeActionResult = {
        commandId: command.id,
        moduleId,
        action,
        success: false,
        message,
        durationMs,
        completedAt: new Date().toISOString(),
      };

      this.panel.recordResult(result);
      this.publish(RUNTIME_ACTION_TOPICS.failed, {
        ...startedPayload,
        success: false,
        durationMs,
        message,
      });

      return result;
    }
  }

  private isActionEnabled(module: RuntimeModuleSnapshot, action: RuntimeActionType): boolean {
    if (module.status === "failed" && action !== "restart_module" && action !== "refresh_module") {
      return false;
    }
    if (action === "pause_module") return module.status === "ready";
    if (action === "resume_module") return module.status === "paused";
    if (action === "restart_module") {
      return module.status === "ready" || module.status === "paused" || module.status === "failed";
    }
    return module.status === "ready" || module.status === "paused";
  }

  private disabledReason(module: RuntimeModuleSnapshot, action: RuntimeActionType): string {
    if (action === "pause_module" && module.status !== "ready") {
      return "Only ready modules can be paused";
    }
    if (action === "resume_module" && module.status !== "paused") {
      return "Only paused modules can be resumed";
    }
    return `Action unavailable for status ${module.status}`;
  }
}

export function createRuntimeControlService(
  options: RuntimeControlServiceOptions,
): RuntimeControlService {
  return new RuntimeControlService(options);
}
