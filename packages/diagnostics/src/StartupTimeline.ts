import type { DiagnosticsBootstrapInput, StartupTimeline } from "./DiagnosticsTypes";

export class StartupTimelineBuilder {
  build(bootstrap: DiagnosticsBootstrapInput | null): StartupTimeline {
    if (!bootstrap) {
      return { entries: [], bootDurationMs: 0 };
    }

    const sorted = [...bootstrap.modules].sort((left, right) => {
      const leftTime = left.loadedAt ? new Date(left.loadedAt).getTime() : 0;
      const rightTime = right.loadedAt ? new Date(right.loadedAt).getTime() : 0;
      return leftTime - rightTime;
    });

    return {
      entries: sorted.map((module, index) => ({
        order: index + 1,
        moduleId: module.id,
        moduleName: module.name,
        timestamp: module.loadedAt ?? new Date().toISOString(),
        initTimeMs: module.initTimeMs,
        status: module.status,
      })),
      bootDurationMs: bootstrap.bootDurationMs,
      bootStartedAt: bootstrap.bootStartedAt,
      bootCompletedAt: bootstrap.bootCompletedAt,
    };
  }
}
