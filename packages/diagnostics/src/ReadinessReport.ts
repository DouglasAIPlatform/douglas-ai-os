import type {
  DiagnosticIssue,
  DiagnosticRecommendation,
  DiagnosticsInput,
  ReadinessReport,
  ReadinessStatus,
} from "./DiagnosticsTypes";
import { createDiagnosticIssue } from "./DiagnosticIssue";
import { createDiagnosticRecommendation } from "./DiagnosticRecommendation";
import { ModuleStartupDiagnosticBuilder } from "./ModuleStartupDiagnostic";
import { StartupTimelineBuilder } from "./StartupTimeline";
import { stabilizeReadinessScore } from "./ReadinessScorePolicy";
import { READINESS_SCORE_POLICY } from "./ReadinessScorePolicy";

export interface ReadinessCheck {
  id: string;
  name: string;
  evaluate(input: DiagnosticsInput): {
    issues: DiagnosticIssue[];
    warnings: DiagnosticIssue[];
    recommendations: DiagnosticRecommendation[];
    scorePenalty: number;
  };
}

export class BootstrapReadinessCheck implements ReadinessCheck {
  id = "bootstrap";
  name = "Bootstrap";

  evaluate(input: DiagnosticsInput) {
    const issues: DiagnosticIssue[] = [];
    const warnings: DiagnosticIssue[] = [];
    const recommendations: DiagnosticRecommendation[] = [];
    let scorePenalty = 0;

    if (!input.bootstrap) {
      issues.push(
        createDiagnosticIssue("critical", "Bootstrap not available", "bootstrap"),
      );
      return { issues, warnings, recommendations, scorePenalty: 50 };
    }

    if (input.bootstrap.isBooting) {
      warnings.push(
        createDiagnosticIssue("warning", "Bootstrap still in progress", "bootstrap"),
      );
      scorePenalty += 20;
    }

    if (!input.bootstrap.isReady) {
      issues.push(
        createDiagnosticIssue("critical", "Bootstrap not ready", "bootstrap"),
      );
      scorePenalty += 30;
    }

    input.bootstrap.modules
      .filter((module) => module.status === "failed")
      .forEach((module) => {
        issues.push(
          createDiagnosticIssue(
            "critical",
            `Bootstrap module failed: ${module.name}`,
            "bootstrap",
            module.id,
          ),
        );
        scorePenalty += 10;
      });

    input.bootstrap.modules
      .filter((module) => module.status === "degraded")
      .forEach((module) => {
        warnings.push(
          createDiagnosticIssue(
            "warning",
            `Bootstrap module degraded: ${module.name}`,
            "bootstrap",
            module.id,
          ),
        );
        scorePenalty += 5;
      });

    return { issues, warnings, recommendations, scorePenalty };
  }
}

export class RuntimeReadinessCheck implements ReadinessCheck {
  id = "runtime";
  name = "Runtime";

  evaluate(input: DiagnosticsInput) {
    const issues: DiagnosticIssue[] = [];
    const warnings: DiagnosticIssue[] = [];
    const recommendations: DiagnosticRecommendation[] = [];
    let scorePenalty = 0;

    if (!input.runtime) {
      warnings.push(
        createDiagnosticIssue("warning", "Runtime not available", "runtime"),
      );
      return { issues, warnings, recommendations, scorePenalty: 15 };
    }

    if (input.runtime.isStarting) {
      warnings.push(
        createDiagnosticIssue("warning", "Runtime still starting", "runtime"),
      );
      scorePenalty += 15;
    }

    if (!input.runtime.isRunning) {
      issues.push(createDiagnosticIssue("critical", "Runtime not running", "runtime"));
      scorePenalty += 25;
      recommendations.push(
        createDiagnosticRecommendation("high", "Wait for runtime to complete startup"),
      );
    }

    input.runtime.modules
      .filter((module) => module.status === "failed")
      .forEach((module) => {
        issues.push(
          createDiagnosticIssue(
            "critical",
            `Runtime module failed: ${module.name}`,
            "runtime",
            module.id,
          ),
        );
        scorePenalty += 8;
      });

    return { issues, warnings, recommendations, scorePenalty };
  }
}

export class HealthReadinessCheck implements ReadinessCheck {
  id = "health";
  name = "Health Engine";

  evaluate(input: DiagnosticsInput) {
    const issues: DiagnosticIssue[] = [];
    const warnings: DiagnosticIssue[] = [];
    const recommendations: DiagnosticRecommendation[] = [];
    let scorePenalty = 0;

    if (!input.health) {
      warnings.push(
        createDiagnosticIssue("warning", "Health Engine not reporting", "health"),
      );
      return { issues, warnings, recommendations, scorePenalty: 10 };
    }

    if (input.health.criticalCount > 0) {
      issues.push(
        createDiagnosticIssue(
          "critical",
          `${input.health.criticalCount} modules in critical health`,
          "health",
        ),
      );
      scorePenalty += input.health.criticalCount * 5;
    }

    if (input.health.warningCount > 0) {
      warnings.push(
        createDiagnosticIssue(
          "warning",
          `${input.health.warningCount} modules with health warnings`,
          "health",
        ),
      );
      scorePenalty += input.health.warningCount * 2;
    }

    return { issues, warnings, recommendations, scorePenalty };
  }
}

export class DependencyGraphReadinessCheck implements ReadinessCheck {
  id = "dependency-graph";
  name = "Dependency Graph";

  evaluate(input: DiagnosticsInput) {
    const issues: DiagnosticIssue[] = [];
    const warnings: DiagnosticIssue[] = [];
    const recommendations: DiagnosticRecommendation[] = [];
    let scorePenalty = 0;

    if (!input.dependencyGraph) return { issues, warnings, recommendations, scorePenalty: 0 };

    if (input.dependencyGraph.circularDependencyCount > 0) {
      issues.push(
        createDiagnosticIssue(
          "critical",
          `${input.dependencyGraph.circularDependencyCount} circular dependencies detected`,
          "dependency-graph",
        ),
      );
      scorePenalty += 20;
    }

    if (input.dependencyGraph.criticalUnavailableCount > 0) {
      issues.push(
        createDiagnosticIssue(
          "critical",
          `${input.dependencyGraph.criticalUnavailableCount} critical dependencies unavailable`,
          "dependency-graph",
        ),
      );
      scorePenalty += 15;
    }

    input.dependencyGraph.issues
      .filter((issue) => issue.severity === "warning")
      .forEach((issue) => {
        warnings.push(
          createDiagnosticIssue("warning", issue.message, "dependency-graph", issue.moduleId),
        );
        scorePenalty += 3;
      });

    return { issues, warnings, recommendations, scorePenalty };
  }
}

export class EventMonitorReadinessCheck implements ReadinessCheck {
  id = "event-monitor";
  name = "Event Monitor";

  evaluate(input: DiagnosticsInput) {
    const issues: DiagnosticIssue[] = [];
    const warnings: DiagnosticIssue[] = [];
    const recommendations: DiagnosticRecommendation[] = [];
    let scorePenalty = 0;

    const critical = input.eventMonitor?.events.filter(
      (event) => event.severity === "critical" || event.severity === "error",
    );

    critical?.forEach((event) => {
      warnings.push(
        createDiagnosticIssue(
          "warning",
          `Recent critical event: ${event.message}`,
          "event-monitor",
          String(event.source),
        ),
      );
      scorePenalty += 5;
    });

    return { issues, warnings, recommendations, scorePenalty };
  }
}

export const DEFAULT_READINESS_CHECKS: ReadinessCheck[] = [
  new BootstrapReadinessCheck(),
  new RuntimeReadinessCheck(),
  new HealthReadinessCheck(),
  new DependencyGraphReadinessCheck(),
  new EventMonitorReadinessCheck(),
];

export class ReadinessReportBuilder {
  private readonly moduleBuilder = new ModuleStartupDiagnosticBuilder();
  private readonly timelineBuilder = new StartupTimelineBuilder();

  build(
    input: DiagnosticsInput,
    checks: ReadinessCheck[] = DEFAULT_READINESS_CHECKS,
  ): ReadinessReport {
    const criticalIssues: DiagnosticIssue[] = [];
    const warnings: DiagnosticIssue[] = [];
    const recommendations: DiagnosticRecommendation[] = [];
    let scorePenalty = 0;

    checks.forEach((check) => {
      const result = check.evaluate(input);
      criticalIssues.push(...result.issues);
      warnings.push(...result.warnings);
      recommendations.push(...result.recommendations);
      scorePenalty += result.scorePenalty;
    });

    const moduleDiagnostics = this.moduleBuilder.build(
      input.bootstrap,
      input.runtime,
      input.health,
    );

    const notReadyModules = moduleDiagnostics.filter((module) => !module.ready).length;
    scorePenalty += notReadyModules * 3;

    const score = stabilizeReadinessScore(
      scorePenalty,
      warnings.length,
      criticalIssues.length,
    );

    let status: ReadinessStatus = "ready";
    if (criticalIssues.length > 0 || score < 50) status = "not_ready";
    else if (warnings.length > 0 || score < 80) status = "degraded";

    const ready =
      status === "ready" &&
      Boolean(input.bootstrap?.isReady) &&
      Boolean(input.runtime?.isRunning) &&
      criticalIssues.length === 0;

    const recentCriticalEvents =
      input.eventMonitor?.events
        .filter((event) => event.severity === "critical" || event.severity === "error")
        .slice(0, 5)
        .map((event) => ({
          id: event.id,
          source: event.source,
          type: event.type,
          severity: event.severity,
          message: event.message,
          timestamp: event.timestamp,
        })) ?? [];

    if (!ready && recommendations.length === 0) {
      recommendations.push(
        createDiagnosticRecommendation(
          "high",
          "Resolve critical issues before operating the platform",
        ),
      );
    }

    input.platform?.blockers.forEach((blocker) => {
      warnings.push(createDiagnosticIssue("warning", blocker, "platform-state"));
    });

    return {
      ready,
      score,
      status,
      criticalIssues,
      warnings,
      recommendations,
      moduleDiagnostics,
      startupTimeline: this.timelineBuilder.build(input.bootstrap),
      recentCriticalEvents,
      generatedAt: new Date().toISOString(),
    };
  }
}
