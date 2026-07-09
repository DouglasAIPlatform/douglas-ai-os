import type { BootstrapModuleDefinition, BootstrapModuleResult } from "@douglas/bootstrap";
import { DepartmentManager } from "@douglas/departments";
import { MissionManager } from "@douglas/missions";
import { PluginManager } from "@douglas/plugins";
import { agentDefinitions } from "../agents/definitions";
import { analyticsMetricSeeds } from "../analytics-engine";
import { automationDefinitions } from "../automation-engine";
import { coreModuleDefinitions } from "../core";
import {
  departmentDefinitions,
  departmentSeedData,
} from "../departments";
import { missionSeeds } from "../mission-control";
import { notificationSeeds } from "../notifications";
import { productPlugins } from "../plugins";
import { workflowDefinitions } from "../workflow-engine";
import { isHeadquartersDemoSourceEnabled } from "../platform-demo-data/resolveStaticDemoPolicy";

const MODULE_VERSION = "0.1.0";
const bootstrapMocksEnabled = isHeadquartersDemoSourceEnabled("bootstrap_mocks");
const missionMocksEnabled = isHeadquartersDemoSourceEnabled("mission_mocks");

function measure(
  id: string,
  name: string,
  version: string,
  run: () => Pick<BootstrapModuleResult, "status" | "health" | "message">,
): BootstrapModuleResult {
  const start = typeof performance !== "undefined" ? performance.now() : Date.now();
  const outcome = run();
  const elapsed =
    typeof performance !== "undefined" ? performance.now() - start : Date.now() - start;

  return {
    id,
    name,
    version,
    status: outcome.status ?? "ready",
    health: outcome.health ?? "healthy",
    initTimeMs: Math.round(elapsed),
    message: outcome.message,
  };
}

export const platformBootstrapModules: BootstrapModuleDefinition[] = [
  {
    id: "core",
    name: "Douglas Core",
    version: MODULE_VERSION,
    dependencies: [],
    load: () =>
      measure("core", "Douglas Core", MODULE_VERSION, () => ({
        status: "ready",
        health: "healthy",
        message: `${coreModuleDefinitions.length} core modules registered`,
      })),
  },
  {
    id: "dos",
    name: "Douglas Operating System",
    version: MODULE_VERSION,
    dependencies: ["core"],
    load: () =>
      measure("dos", "Douglas Operating System", MODULE_VERSION, () => ({
        status: "ready",
        health: "healthy",
        message: "DOS boot delegated to DOSProvider (live integration)",
      })),
  },
  {
    id: "brain",
    name: "Douglas Brain",
    version: MODULE_VERSION,
    dependencies: ["core"],
    load: () =>
      measure("brain", "Douglas Brain", MODULE_VERSION, () => ({
        status: "ready",
        health: "healthy",
        message: "8 brain domains prepared",
      })),
  },
  {
    id: "plugins",
    name: "Plugin System",
    version: MODULE_VERSION,
    dependencies: ["dos"],
    load: () =>
      measure("plugins", "Plugin System", MODULE_VERSION, () => {
        const manager = new PluginManager();
        manager.register(productPlugins);
        return {
          status: "ready",
          health: "healthy",
          message: `${manager.getReadyPlugins().length} plugins validated`,
        };
      }),
  },
  {
    id: "agents",
    name: "Agent Framework",
    version: MODULE_VERSION,
    dependencies: ["core"],
    load: () =>
      measure("agents", "Agent Framework", MODULE_VERSION, () => ({
        status: "ready",
        health: "healthy",
        message: `${agentDefinitions.length} agents registered`,
      })),
  },
  {
    id: "workflow",
    name: "Workflow Engine",
    version: MODULE_VERSION,
    dependencies: ["agents"],
    load: () =>
      measure("workflow", "Workflow Engine", MODULE_VERSION, () => ({
        status: "ready",
        health: "healthy",
        message: `${workflowDefinitions.length} workflows loaded`,
      })),
  },
  {
    id: "automation",
    name: "Automation Engine",
    version: MODULE_VERSION,
    dependencies: ["workflow"],
    load: () =>
      measure("automation", "Automation Engine", MODULE_VERSION, () => ({
        status: "ready",
        health: "healthy",
        message: `${automationDefinitions.length} automations loaded`,
      })),
  },
  {
    id: "departments",
    name: "Department Manager",
    version: MODULE_VERSION,
    dependencies: ["core"],
    load: () =>
      measure("departments", "Department Manager", MODULE_VERSION, () => {
        const manager = new DepartmentManager();
        if (bootstrapMocksEnabled) {
          manager.registerDepartments(departmentDefinitions);
          departmentSeedData.agentRegistrations?.forEach(({ departmentId, agentId }) => {
            manager.registerAgent(departmentId, agentId);
          });
        }
        return {
          status: "ready",
          health: "healthy",
          message: bootstrapMocksEnabled
            ? `${manager.getAllDepartments().length} departments active`
            : "Aguardando dados reais de departamentos",
        };
      }),
  },
  {
    id: "missions",
    name: "Mission Control",
    version: MODULE_VERSION,
    dependencies: ["departments"],
    load: () =>
      measure("missions", "Mission Control", MODULE_VERSION, () => {
        const manager = new MissionManager();
        if (missionMocksEnabled) {
          manager.getRepository().seed(missionSeeds);
        }
        return {
          status: "ready",
          health: "healthy",
          message: missionMocksEnabled
            ? `${manager.list().length} missions loaded`
            : "Aguardando dados reais de missões",
        };
      }),
  },
  {
    id: "analytics",
    name: "Analytics Engine",
    version: MODULE_VERSION,
    dependencies: ["workflow", "automation"],
    load: () =>
      measure("analytics", "Analytics Engine", MODULE_VERSION, () => ({
        status: "ready",
        health: "healthy",
        message: bootstrapMocksEnabled
          ? `${analyticsMetricSeeds.length} metric seeds prepared`
          : "Aguardando dados reais de analytics",
      })),
  },
  {
    id: "notifications",
    name: "Notification Center",
    version: MODULE_VERSION,
    dependencies: ["core"],
    load: () =>
      measure("notifications", "Notification Center", MODULE_VERSION, () => ({
        status: "ready",
        health: "healthy",
        message: bootstrapMocksEnabled
          ? `${notificationSeeds.length} notifications seeded`
          : "Aguardando dados reais de notificações",
      })),
  },
];

export const platformBootstrapOptions = {
  platformVersion: MODULE_VERSION,
  modules: platformBootstrapModules,
};
