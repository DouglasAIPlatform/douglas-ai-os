import type { RuntimeModuleDefinition } from "@douglas/runtime";
import { agentDefinitions } from "../agents/definitions";
import { analyticsMetricSeeds } from "../analytics-engine";
import { automationDefinitions } from "../automation-engine";
import { coreModuleDefinitions } from "../core";
import { missionSeeds } from "../mission-control";
import { notificationSeeds } from "../notifications";
import { productPlugins } from "../plugins";
import { workflowDefinitions } from "../workflow-engine";

const MODULE_VERSION = "0.1.0";

function createModule(
  id: string,
  name: string,
  message: string,
  onInitialize?: (ctx: Parameters<RuntimeModuleDefinition["initialize"]>[0]) => void,
): RuntimeModuleDefinition {
  return {
    id,
    name,
    version: MODULE_VERSION,
    initialize(ctx) {
      ctx.publish("internal:module:loaded", {
        moduleId: id,
        version: MODULE_VERSION,
      });
      onInitialize?.(ctx);
    },
    start() {
      // Mock runtime activation — modules stay alive without cross-module imports.
    },
    healthCheck: () => "healthy",
    stop() {
      // Mock graceful stop.
    },
  };
}

export const platformRuntimeModules: RuntimeModuleDefinition[] = [
  createModule("core", "Douglas Core", `${coreModuleDefinitions.length} core modules`, (ctx) => {
    ctx.subscribe("system:health:check", () => {
      ctx.publish("system:health:check", { status: "healthy" });
    });
  }),
  createModule("dos", "Douglas Operating System", "OS kernel active", (ctx) => {
    ctx.subscribe("internal:module:loaded", (payload) => {
      if (payload.moduleId === "core") {
        ctx.publish("internal:module:ready", { moduleId: "dos" });
      }
    });
  }),
  createModule("brain", "Douglas Brain", "8 brain domains", (ctx) => {
    ctx.subscribe("system:platform:ready", () => {
      ctx.publish("ai:inference:requested", {
        agentId: "brain-orchestrator",
        adapterId: "mock",
      });
    });
  }),
  createModule("plugins", "Plugin System", `${productPlugins.length} plugins`, (ctx) => {
    ctx.subscribe("internal:module:ready", (payload) => {
      if (payload.moduleId === "dos") {
        ctx.publish("internal:module:ready", { moduleId: "plugins" });
      }
    });
  }),
  createModule("agents", "Agent Framework", `${agentDefinitions.length} agents`),
  createModule("workflow", "Workflow Engine", `${workflowDefinitions.length} workflows`, (ctx) => {
    ctx.subscribe("workflow:started", (payload) => {
      ctx.publish("workflow:completed", {
        workflowId: String(payload.workflowId ?? ""),
        executionId: String(payload.executionId ?? ""),
        status: "completed",
      });
    });
  }),
  createModule("automation", "Automation Engine", `${automationDefinitions.length} automations`, (ctx) => {
    ctx.subscribe("automation:triggered", (payload) => {
      ctx.publish("automation:completed", {
        automationId: String(payload.automationId ?? ""),
        runId: `run-${Date.now()}`,
        status: "completed",
      });
    });
  }),
  createModule("missions", "Mission Control", `${missionSeeds.length} missions`, (ctx) => {
    ctx.subscribe("system:platform:ready", () => {
      ctx.publish("internal:module:ready", { moduleId: "missions" });
    });
  }),
  createModule("analytics", "Analytics Engine", `${analyticsMetricSeeds.length} metrics`, (ctx) => {
    ctx.subscribe("workflow:completed", () => {
      ctx.publish("system:health:check", { status: "healthy" });
    });
  }),
  createModule("notifications", "Notification Center", `${notificationSeeds.length} notifications`, (ctx) => {
    ctx.subscribe("automation:completed", () => {
      ctx.publish("internal:module:ready", { moduleId: "notifications" });
    });
  }),
];

export const platformRuntimeOptions = {
  platformVersion: MODULE_VERSION,
  modules: platformRuntimeModules,
};
