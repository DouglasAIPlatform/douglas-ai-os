import type {
  DiagnosticsInput,
  DiagnosticsReportEventPayload,
  ReadinessReport,
} from "./DiagnosticsTypes";
import { DIAGNOSTICS_EVENT_TOPICS } from "./DiagnosticsTypes";
import { shouldPublishDiagnosticsCompleted } from "./DiagnosticsEventPolicy";
import { ReadinessReportBuilder, type ReadinessCheck } from "./ReadinessReport";

export interface BootDiagnosticsOptions {
  checks?: ReadinessCheck[];
  publish?: (topic: string, payload: DiagnosticsReportEventPayload) => void;
}

function createReportId(): string {
  return `diag:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

export class BootDiagnostics {
  private readonly builder: ReadinessReportBuilder;
  private readonly checks: ReadinessCheck[];
  private readonly publish: (topic: string, payload: DiagnosticsReportEventPayload) => void;
  private lastReport: ReadinessReport | null = null;
  private lastPublishedReport: ReadinessReport | null = null;

  constructor(options: BootDiagnosticsOptions = {}) {
    this.builder = new ReadinessReportBuilder();
    this.checks = options.checks ?? [];
    this.publish = options.publish ?? (() => undefined);
  }

  async generate(input: DiagnosticsInput): Promise<ReadinessReport> {
    const reportId = createReportId();
    const startedAt =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    const checks =
      this.checks.length > 0 ? this.checks : undefined;

    try {
      const report = this.builder.build(input, checks as ReadinessCheck[] | undefined);

      const durationMs = Math.round(
        (typeof performance !== "undefined" ? performance.now() : Date.now()) - startedAt,
      );

      this.lastReport = report;

      const shouldPublish = shouldPublishDiagnosticsCompleted(
        this.lastPublishedReport,
        report,
      );

      if (shouldPublish) {
        this.publish(DIAGNOSTICS_EVENT_TOPICS.started, {
          reportId,
          ready: false,
          score: 0,
          status: "not_ready",
          message: "Diagnostics report started",
        });

        this.publish(DIAGNOSTICS_EVENT_TOPICS.completed, {
          reportId,
          ready: report.ready,
          score: report.score,
          status: report.status,
          message: `Diagnostics completed — ${report.status}`,
          durationMs,
        });

        this.lastPublishedReport = report;
      }

      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Diagnostics failed";
      const durationMs = Math.round(
        (typeof performance !== "undefined" ? performance.now() : Date.now()) - startedAt,
      );

      this.publish(DIAGNOSTICS_EVENT_TOPICS.failed, {
        reportId,
        ready: false,
        score: 0,
        status: "not_ready",
        message,
        durationMs,
      });

      throw error;
    }
  }

  getLastReport(): ReadinessReport | null {
    return this.lastReport;
  }

  getLastPublishedReport(): ReadinessReport | null {
    return this.lastPublishedReport;
  }
}

export function createBootDiagnostics(options?: BootDiagnosticsOptions): BootDiagnostics {
  return new BootDiagnostics(options);
}
