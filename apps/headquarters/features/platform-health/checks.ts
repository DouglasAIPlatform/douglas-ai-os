import type { BootstrapModuleSnapshot } from "@douglas/bootstrap";
import type {
  HealthCheckDefinition,
  HealthModuleResult,
  HealthModuleStatus,
} from "@douglas/health";
import { createHealthIssue, createHealthRecommendation } from "@douglas/health";
import type { RuntimeModuleSnapshot } from "@douglas/runtime";
import { agentDefinitions } from "../agents/definitions";
import { analyticsMetricSeeds } from "../analytics-engine";
import { automationDefinitions } from "../automation-engine";
import { coreModuleDefinitions } from "../core";
import { missionSeeds } from "../mission-control";
import { notificationSeeds } from "../notifications";
import { productPlugins } from "../plugins";
import { workflowDefinitions } from "../workflow-engine";

export interface PlatformHealthSources {
  bootstrapReady: boolean;
  runtimeRunning: boolean;
  platformUptimeMs: number;
  findBootstrapModule: (id: string) => BootstrapModuleSnapshot | undefined;
  findRuntimeModule: (id: string) => RuntimeModuleSnapshot | undefined;
  dos?: {
    isReady: boolean;
    health: string;
    status: string;
    readyModuleCount: number;
    moduleCount: number;
  };
}

function mapBootstrapStatus(
  snapshot: BootstrapModuleSnapshot | undefined,
  platformReady: boolean,
): HealthModuleStatus {
  if (!platformReady || !snapshot) return "offline";
  if (snapshot.status === "failed") return "critical";
  if (snapshot.status === "degraded" || snapshot.health === "degraded") return "warning";
  if (snapshot.health === "unhealthy") return "critical";
  return "healthy";
}

function mapRuntimeStatus(
  snapshot: RuntimeModuleSnapshot | undefined,
  platformRunning: boolean,
): HealthModuleStatus {
  if (!platformRunning || !snapshot) return "offline";
  if (snapshot.status === "failed") return "critical";
  if (snapshot.status === "paused" || snapshot.health === "degraded") return "warning";
  if (snapshot.health === "unhealthy") return "critical";
  if (snapshot.status !== "ready") return "warning";
  return "healthy";
}

function buildResult(
  moduleId: string,
  moduleName: string,
  status: HealthModuleStatus,
  message: string,
  uptimeMs: number,
  metadata: Record<string, string | number | boolean>,
  issues: ReturnType<typeof createHealthIssue>[] = [],
  recommendations: ReturnType<typeof createHealthRecommendation>[] = [],
): HealthModuleResult {
  return {
    moduleId,
    moduleName,
    status,
    message,
    lastCheckedAt: new Date().toISOString(),
    uptimeMs,
    issues,
    recommendations,
    metadata,
  };
}

function createLinkedCheck(
  id: string,
  name: string,
  bootstrapId: string,
  runtimeId: string,
  sources: PlatformHealthSources,
  mockMetadata: Record<string, string | number | boolean>,
  mockMessage: string,
): HealthCheckDefinition {
  return {
    id,
    name,
    check: () => {
      if (id === "dos" && sources.dos) {
        const dos = sources.dos;
        let status: HealthModuleStatus = "healthy";
        if (!dos.isReady || dos.health === "unhealthy") status = "critical";
        else if (dos.health === "degraded") status = "warning";

        return buildResult(
          id,
          name,
          status,
          `${dos.readyModuleCount}/${dos.moduleCount} DOS modules live (DOSProvider)`,
          0,
          {
            ...mockMetadata,
            dosStatus: dos.status,
            dosHealth: dos.health,
            live: true,
          },
          status !== "healthy"
            ? [createHealthIssue(id, status === "critical" ? "critical" : "warning", "DOS degraded")]
            : [],
        );
      }

      const bootstrap = sources.findBootstrapModule(bootstrapId);
      const runtime = sources.findRuntimeModule(runtimeId);
      const bootstrapStatus = mapBootstrapStatus(bootstrap, sources.bootstrapReady);
      const runtimeStatus = mapRuntimeStatus(runtime, sources.runtimeRunning);

      let status: HealthModuleStatus = "healthy";
      if (bootstrapStatus === "critical" || runtimeStatus === "critical") {
        status = "critical";
      } else if (bootstrapStatus === "offline" && runtimeStatus === "offline") {
        status = "offline";
      } else if (bootstrapStatus === "warning" || runtimeStatus === "warning") {
        status = "warning";
      } else if (bootstrapStatus === "offline" || runtimeStatus === "offline") {
        status = "warning";
      }

      const issues = [];
      const recommendations = [];

      if (bootstrapStatus === "critical") {
        issues.push(createHealthIssue(id, "critical", `Bootstrap ${bootstrapId} failed`));
        recommendations.push(
          createHealthRecommendation(id, "high", `Reiniciar módulo ${name} via bootstrap`),
        );
      }
      if (runtimeStatus === "critical") {
        issues.push(createHealthIssue(id, "critical", `Runtime ${runtimeId} failed`));
        recommendations.push(
          createHealthRecommendation(id, "high", `Reiniciar módulo ${name} via runtime`),
        );
      }
      if (status === "warning") {
        issues.push(createHealthIssue(id, "warning", `${name} operando com degradação`));
      }

      return buildResult(
        id,
        name,
        status,
        status === "healthy" ? mockMessage : `${mockMessage} — ${status}`,
        runtime?.uptimeMs ?? bootstrap?.initTimeMs ?? 0,
        {
          ...mockMetadata,
          bootstrapStatus: bootstrap?.status ?? "unknown",
          runtimeStatus: runtime?.status ?? "unknown",
        },
        issues,
        recommendations,
      );
    },
  };
}

export function createPlatformHealthChecks(
  sources: PlatformHealthSources,
): HealthCheckDefinition[] {
  return [
    createLinkedCheck(
      "core",
      "Douglas Core",
      "core",
      "core",
      sources,
      { moduleCount: coreModuleDefinitions.length },
      `${coreModuleDefinitions.length} core modules registered`,
    ),
    createLinkedCheck(
      "dos",
      "Douglas Operating System",
      "dos",
      "dos",
      sources,
      { environment: "development" },
      "OS kernel active",
    ),
    createLinkedCheck(
      "brain",
      "Douglas Brain",
      "brain",
      "brain",
      sources,
      { domainCount: 8 },
      "8 brain domains prepared",
    ),
    createLinkedCheck(
      "agents",
      "Agent Framework",
      "agents",
      "agents",
      sources,
      { agentCount: agentDefinitions.length },
      `${agentDefinitions.length} agents registered`,
    ),
    createLinkedCheck(
      "missions",
      "Mission Control",
      "missions",
      "missions",
      sources,
      { missionCount: missionSeeds.length },
      `${missionSeeds.length} missions loaded`,
    ),
    createLinkedCheck(
      "workflow",
      "Workflow Engine",
      "workflow",
      "workflow",
      sources,
      { workflowCount: workflowDefinitions.length },
      `${workflowDefinitions.length} workflows loaded`,
    ),
    createLinkedCheck(
      "automation",
      "Automation Engine",
      "automation",
      "automation",
      sources,
      { automationCount: automationDefinitions.length },
      `${automationDefinitions.length} automations loaded`,
    ),
    createLinkedCheck(
      "analytics",
      "Analytics Engine",
      "analytics",
      "analytics",
      sources,
      { metricCount: analyticsMetricSeeds.length },
      `${analyticsMetricSeeds.length} metric seeds prepared`,
    ),
    createLinkedCheck(
      "notifications",
      "Notification Center",
      "notifications",
      "notifications",
      sources,
      { notificationCount: notificationSeeds.length },
      `${notificationSeeds.length} notifications seeded`,
    ),
    createLinkedCheck(
      "plugins",
      "Plugin System",
      "plugins",
      "plugins",
      sources,
      { pluginCount: productPlugins.length },
      `${productPlugins.length} plugins validated`,
    ),
    {
      id: "runtime",
      name: "Platform Runtime",
      check: () => {
        if (!sources.runtimeRunning) {
          return buildResult(
            "runtime",
            "Platform Runtime",
            "offline",
            "Runtime não iniciado",
            0,
            { moduleCount: 0 },
            [createHealthIssue("runtime", "critical", "Platform runtime is offline")],
            [
              createHealthRecommendation(
                "runtime",
                "high",
                "Aguardar conclusão do bootstrap e inicialização do runtime",
              ),
            ],
          );
        }

        const runtimeModules = [
          "core",
          "dos",
          "brain",
          "agents",
          "missions",
          "workflow",
          "automation",
          "analytics",
          "notifications",
          "plugins",
        ].map((id) => sources.findRuntimeModule(id));

        const readyCount = runtimeModules.filter((module) => module?.status === "ready").length;
        const failedCount = runtimeModules.filter((module) => module?.status === "failed").length;
        const pausedCount = runtimeModules.filter((module) => module?.status === "paused").length;

        let status: HealthModuleStatus = "healthy";
        if (failedCount > 0) status = "critical";
        else if (pausedCount > 0) status = "warning";
        else if (readyCount < runtimeModules.length) status = "warning";

        const issues = [];
        if (failedCount > 0) {
          issues.push(
            createHealthIssue("runtime", "critical", `${failedCount} runtime modules failed`),
          );
        }
        if (pausedCount > 0) {
          issues.push(
            createHealthIssue("runtime", "warning", `${pausedCount} runtime modules paused`),
          );
        }

        return buildResult(
          "runtime",
          "Platform Runtime",
          status,
          `${readyCount}/${runtimeModules.length} runtime modules ready`,
          sources.platformUptimeMs,
          { readyCount, failedCount, pausedCount, totalModules: runtimeModules.length },
          issues,
          failedCount > 0
            ? [
                createHealthRecommendation(
                  "runtime",
                  "high",
                  "Reiniciar módulos runtime com falha",
                ),
              ]
            : [],
        );
      },
    },
  ];
}
