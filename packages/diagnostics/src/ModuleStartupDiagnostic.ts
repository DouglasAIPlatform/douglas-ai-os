import type {
  DiagnosticsBootstrapInput,
  DiagnosticsHealthInput,
  DiagnosticsRuntimeInput,
  ModuleStartupDiagnostic,
} from "./DiagnosticsTypes";

export class ModuleStartupDiagnosticBuilder {
  build(
    bootstrap: DiagnosticsBootstrapInput | null,
    runtime: DiagnosticsRuntimeInput | null,
    health: DiagnosticsHealthInput | null,
  ): ModuleStartupDiagnostic[] {
    const moduleIds = new Set<string>();

    bootstrap?.modules.forEach((module) => moduleIds.add(module.id));
    runtime?.modules.forEach((module) => moduleIds.add(module.id));
    health?.modules.forEach((module) => moduleIds.add(module.moduleId));

    return [...moduleIds].map((moduleId) => {
      const boot = bootstrap?.modules.find((module) => module.id === moduleId);
      const run = runtime?.modules.find((module) => module.id === moduleId);
      const heal = health?.modules.find((module) => module.moduleId === moduleId);

      const ready =
        (boot?.status === "ready" || boot?.status === "degraded") &&
        (run?.status === "ready" || !run) &&
        heal?.status !== "critical" &&
        heal?.status !== "offline";

      return {
        moduleId,
        moduleName: boot?.name ?? run?.name ?? heal?.moduleName ?? moduleId,
        bootstrapStatus: boot?.status ?? "unknown",
        runtimeStatus: run?.status,
        healthStatus: heal?.status,
        initTimeMs: boot?.initTimeMs,
        loadedAt: boot?.loadedAt,
        ready: Boolean(ready),
        message: boot?.message ?? run?.message ?? heal?.message,
      };
    });
  }
}
