import type { RBACCatalogComparisonResult } from "./RBACCatalogComparison.ts";
import type { RBACCatalogMismatch } from "./RBACCatalogMismatch.ts";

export type RBACCatalogDriftStatus = "passed" | "passed_with_warnings" | "failed";

export interface RBACCatalogDriftReport {
  status: RBACCatalogDriftStatus;
  checkedAt: string;
  canonicalPath: string;
  comparisons: RBACCatalogComparisonResult[];
  mismatches: RBACCatalogMismatch[];
  errorCount: number;
  warningCount: number;
}

export function buildRBACCatalogDriftReport(
  comparisons: RBACCatalogComparisonResult[],
  canonicalPath: string,
): RBACCatalogDriftReport {
  const mismatches = comparisons.flatMap((comparison) => comparison.mismatches);
  const errorCount = mismatches.filter((item) => item.severity === "error").length;
  const warningCount = mismatches.filter((item) => item.severity === "warning").length;

  let status: RBACCatalogDriftStatus = "passed";
  if (errorCount > 0) {
    status = "failed";
  } else if (warningCount > 0) {
    status = "passed_with_warnings";
  }

  return {
    status,
    checkedAt: new Date().toISOString(),
    canonicalPath,
    comparisons,
    mismatches,
    errorCount,
    warningCount,
  };
}

export function formatRBACCatalogDriftReport(report: RBACCatalogDriftReport): string {
  const lines: string[] = [];

  lines.push("Douglas AI OS — RBAC Catalog Drift Check");
  lines.push(`Status: ${report.status}`);
  lines.push(`Verificado em: ${report.checkedAt}`);
  lines.push(`Fonte canônica: ${report.canonicalPath}`);
  lines.push("");

  for (const comparison of report.comparisons) {
    const icon = comparison.aligned ? "✓" : "✗";
    lines.push(`${icon} ${comparison.sourceId}${comparison.aligned ? " alinhado" : " divergente"}`);
  }

  const clientAligned = !report.mismatches.some(
    (item) => item.sourceId === "client" && item.severity === "error",
  );
  lines.push(`${clientAligned ? "✓" : "✗"} client (Permission.ts via vitest)`);

  if (report.mismatches.length > 0) {
    lines.push("");
    lines.push(`Divergências (${report.errorCount} erros, ${report.warningCount} alertas)`);
    for (const mismatch of report.mismatches) {
      const prefix = mismatch.severity === "error" ? "✗" : "!";
      lines.push(`  ${prefix} [${mismatch.sourceId}] ${mismatch.message}`);
    }
  }

  return lines.join("\n");
}
