import type {
  PlatformBootstrapLayerInput,
  PlatformDosLayerInput,
  PlatformEventMonitorLayerInput,
  PlatformHealthLayerInput,
  PlatformLayerSnapshot,
  PlatformLayerStatus,
  PlatformModuleOverallStatus,
  PlatformModuleSnapshot,
  PlatformOverallStatus,
  PlatformReadiness,
  PlatformReadinessLevel,
  PlatformRuntimeLayerInput,
  PlatformSnapshot,
  PlatformStateInput,
  PlatformStatusSummary,
} from "./PlatformStateTypes";

function mapHealthToLayerStatus(status: string): PlatformLayerStatus {
  if (status === "healthy" || status === "ready" || status === "running") return "healthy";
  if (status === "warning" || status === "degraded" || status === "alert") return "warning";
  if (status === "critical" || status === "unhealthy" || status === "failed" || status === "error") {
    return "critical";
  }
  if (status === "offline" || status === "stopped") return "offline";
  return "unknown";
}

function resolveModuleOverallStatus(
  bootstrapStatus?: string,
  runtimeStatus?: string,
  healthStatus?: string,
): PlatformModuleOverallStatus {
  const values = [bootstrapStatus, runtimeStatus, healthStatus].filter(Boolean);

  if (values.some((value) => value === "failed" || value === "critical" || value === "unhealthy")) {
    return "critical";
  }
  if (values.some((value) => value === "offline" || value === "stopped")) {
    return "offline";
  }
  if (
    values.some(
      (value) =>
        value === "warning" ||
        value === "degraded" ||
        value === "paused" ||
        value === "alert",
    )
  ) {
    return "alert";
  }
  if (values.some((value) => value === "ready" || value === "healthy")) {
    return "ready";
  }
  return "unknown";
}

function buildModuleCatalog(input: PlatformStateInput): PlatformModuleSnapshot[] {
  const moduleMap = new Map<string, PlatformModuleSnapshot>();

  const upsert = (
    id: string,
    name: string,
    version: string,
    patch: Partial<PlatformModuleSnapshot>,
  ) => {
    const current = moduleMap.get(id);
    moduleMap.set(id, {
      id,
      name: current?.name ?? name,
      version: current?.version ?? version,
      overallStatus: current?.overallStatus ?? "unknown",
      ...current,
      ...patch,
    });
  };

  input.bootstrap?.modules.forEach((module) => {
    upsert(module.id, module.name, module.version, {
      bootstrapStatus: module.status,
      message: module.message,
    });
  });

  input.runtime?.modules.forEach((module) => {
    upsert(module.id, module.name, module.version, {
      runtimeStatus: module.status,
      message: module.message ?? moduleMap.get(module.id)?.message,
    });
  });

  input.health?.modules.forEach((module) => {
    upsert(module.moduleId, module.moduleName, "0.1.0", {
      healthStatus: module.status,
      message: module.message ?? moduleMap.get(module.moduleId)?.message,
    });
  });

  if (input.dos) {
    upsert("dos", "Douglas Operating System", "0.1.0", {
      dosStatus: input.dos.isReady ? "ready" : input.dos.status,
      message: `${input.dos.readyModuleCount}/${input.dos.moduleCount} DOS modules`,
    });
  }

  return [...moduleMap.values()].map((module) => ({
    ...module,
    overallStatus: resolveModuleOverallStatus(
      module.bootstrapStatus,
      module.runtimeStatus,
      module.healthStatus,
    ),
  }));
}

function buildSummary(modules: PlatformModuleSnapshot[]): PlatformStatusSummary {
  const readyModules = modules.filter((module) => module.overallStatus === "ready").length;
  const alertModules = modules.filter((module) => module.overallStatus === "alert").length;
  const criticalModules = modules.filter((module) => module.overallStatus === "critical").length;
  const offlineModules = modules.filter((module) => module.overallStatus === "offline").length;

  let overall: PlatformOverallStatus = "healthy";
  if (criticalModules > 0 || offlineModules === modules.length) overall = "critical";
  else if (offlineModules > 0) overall = "critical";
  else if (alertModules > 0) overall = "warning";

  return {
    overall,
    loadedModules: modules.length,
    readyModules,
    alertModules,
    criticalModules,
    offlineModules,
  };
}

function mapDiagnosticsStatusToLevel(
  status: "ready" | "degraded" | "not_ready",
): PlatformReadinessLevel {
  if (status === "ready") return "ready";
  if (status === "degraded") return "degraded";
  return "degraded";
}

function buildReadiness(input: PlatformStateInput, summary: PlatformStatusSummary): PlatformReadiness {
  const blockers: string[] = [];

  if (input.bootstrap?.isBooting) {
    blockers.push("Bootstrap em andamento");
  }
  if (input.runtime?.isStarting) {
    blockers.push("Runtime iniciando");
  }
  if (input.health?.isEvaluating) {
    blockers.push("Health Engine avaliando");
  }
  if (input.dos && !input.dos.isReady) {
    blockers.push("DOS não está pronto");
  }
  if (input.dependencyGraph && input.dependencyGraph.issueCount > 0) {
    blockers.push(`${input.dependencyGraph.issueCount} issues no grafo de dependências`);
  }

  if (input.diagnosticsReadiness) {
    const diagnostics = input.diagnosticsReadiness;
    return {
      level: mapDiagnosticsStatusToLevel(diagnostics.status),
      score: diagnostics.score,
      blockers,
      readyForOperations: diagnostics.ready && blockers.length === 0,
      source: "boot-diagnostics",
    };
  }

  let level: PlatformReadinessLevel = "offline";
  if (input.bootstrap?.isBooting || input.runtime?.isStarting) {
    level = "booting";
  } else if (!input.bootstrap?.isReady) {
    level = "offline";
  } else if (summary.criticalModules > 0) {
    level = "degraded";
  } else if (summary.alertModules > 0 || summary.readyModules < summary.loadedModules) {
    level = "partial";
  } else if (input.runtime?.isRunning && input.bootstrap?.isReady) {
    level = input.dos?.isReady === false ? "partial" : "ready";
  }

  const scoreBase =
    summary.loadedModules === 0
      ? 0
      : Math.round((summary.readyModules / summary.loadedModules) * 100);

  const penalty = blockers.length * 10;
  const score = Math.max(0, Math.min(100, scoreBase - penalty));

  return {
    level,
    score,
    blockers,
    readyForOperations: level === "ready" && blockers.length === 0,
    source: "platform-fallback",
  };
}

function buildLayer(
  label: string,
  available: boolean,
  status: PlatformLayerStatus,
  detail?: string,
): PlatformLayerSnapshot {
  return { label, available, status, detail };
}

export class PlatformStateFacade {
  build(input: PlatformStateInput): PlatformSnapshot {
    const modules = buildModuleCatalog(input);
    const summary = buildSummary(modules);
    const readiness = buildReadiness(input, summary);

    return {
      generatedAt: new Date().toISOString(),
      platformVersion: input.platformVersion,
      summary,
      readiness,
      modules,
      layers: {
        bootstrap: buildLayer(
          "Bootstrap",
          input.bootstrap !== null,
          input.bootstrap
            ? mapHealthToLayerStatus(input.bootstrap.isBooting ? "booting" : input.bootstrap.status)
            : "offline",
          input.bootstrap
            ? `${input.bootstrap.readyModuleCount}/${input.bootstrap.totalModuleCount} modules`
            : undefined,
        ),
        runtime: buildLayer(
          "Runtime",
          input.runtime !== null,
          input.runtime
            ? mapHealthToLayerStatus(
                input.runtime.isStarting ? "booting" : input.runtime.status,
              )
            : "offline",
          input.runtime
            ? `${input.runtime.readyModuleCount}/${input.runtime.totalModuleCount} modules`
            : undefined,
        ),
        health: buildLayer(
          "Health Engine",
          input.health !== null,
          input.health ? mapHealthToLayerStatus(input.health.status) : "offline",
          input.health
            ? `${input.health.healthyCount} healthy · ${input.health.warningCount} warning`
            : undefined,
        ),
        dependencyGraph: buildLayer(
          "Dependency Graph",
          input.dependencyGraph !== null,
          input.dependencyGraph
            ? mapHealthToLayerStatus(input.dependencyGraph.status)
            : "offline",
          input.dependencyGraph
            ? `${input.dependencyGraph.issueCount} issues`
            : undefined,
        ),
        eventMonitor: buildLayer(
          "Event Monitor",
          input.eventMonitor !== null,
          input.eventMonitor
            ? input.eventMonitor.hasCriticalRecent
              ? "critical"
              : "healthy"
            : "offline",
          input.eventMonitor ? `${input.eventMonitor.totalCount} events` : undefined,
        ),
        dos: buildLayer(
          "DOS",
          input.dos !== null,
          input.dos ? mapHealthToLayerStatus(input.dos.isReady ? "ready" : input.dos.health) : "offline",
          input.dos
            ? `${input.dos.readyModuleCount}/${input.dos.moduleCount} · ${input.dos.runtimePhase}`
            : "Fallback: indisponível",
        ),
      },
    };
  }
}

export function createPlatformStateFacade(): PlatformStateFacade {
  return new PlatformStateFacade();
}
