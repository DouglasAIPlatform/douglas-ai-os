import type { MissionTypeCatalogComparisonResult } from "./MissionTypeCatalogComparison";
import type { MissionTypeCatalogMismatch } from "./MissionTypeCatalogMismatch";

export type MissionTypeCatalogDriftStatus = "passed" | "failed";

export interface MissionTypeCatalogDriftReport {
  status: MissionTypeCatalogDriftStatus;
  checkedAt: string;
  canonicalMissionTypes: string[];
  comparisons: MissionTypeCatalogComparisonResult[];
  mismatches: MissionTypeCatalogMismatch[];
}

export function buildMissionTypeCatalogDriftReport(
  comparisons: MissionTypeCatalogComparisonResult[],
  canonicalMissionTypes: string[],
): MissionTypeCatalogDriftReport {
  const mismatches = comparisons.flatMap((item) => item.mismatches);
  const errors = mismatches.filter((item) => item.severity === "error");

  return {
    status: errors.length === 0 ? "passed" : "failed",
    checkedAt: new Date().toISOString(),
    canonicalMissionTypes,
    comparisons,
    mismatches,
  };
}

export function formatMissionTypeCatalogDriftReport(
  report: MissionTypeCatalogDriftReport,
): string {
  const lines: string[] = [];

  lines.push("Douglas AI OS — Mission Type Catalog Drift Check");
  lines.push(`Status: ${report.status}`);
  lines.push(`Verificado em: ${report.checkedAt}`);
  lines.push(`Catálogo canônico: ${report.canonicalMissionTypes.join(", ")}`);
  lines.push("");

  for (const comparison of report.comparisons) {
    lines.push(
      `${comparison.sourceId}: ${comparison.aligned ? "alinhado" : "DIVERGENTE"}`,
    );
  }

  if (report.mismatches.length > 0) {
    lines.push("");
    lines.push("Divergências");
    for (const mismatch of report.mismatches) {
      lines.push(`  [${mismatch.severity}] ${mismatch.message}`);
    }
  }

  return lines.join("\n");
}
