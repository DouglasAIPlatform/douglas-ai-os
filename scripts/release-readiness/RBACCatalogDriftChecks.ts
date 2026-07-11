import { runRBACCatalogDriftCheck } from "../../packages/security/src/rbac-catalog/RBACCatalogDriftRunner.ts";
import { formatRBACCatalogDriftReport } from "../../packages/security/src/rbac-catalog/RBACCatalogDriftReport.ts";
import type { ReleaseReadinessCheck } from "./ReleaseReadinessCheck.ts";
import { RELEASE_READINESS_CHECK_LABELS } from "./ReleaseReadinessCheck.ts";

const DOC_PATH = "docs/security/rbac-catalog-drift-guard.md";

function check(
  outcome: ReleaseReadinessCheck["outcome"],
  message: string,
): ReleaseReadinessCheck {
  return {
    id: "rbac_catalog_drift_check",
    label: RELEASE_READINESS_CHECK_LABELS.rbac_catalog_drift_check,
    outcome,
    message,
    blocking: true,
    docPath: DOC_PATH,
  };
}

export function checkRBACCatalogDrift(repoRoot: string): ReleaseReadinessCheck {
  const report = runRBACCatalogDriftCheck(repoRoot);

  if (report.status === "failed") {
    const preview = report.mismatches
      .filter((item) => item.severity === "error")
      .slice(0, 3)
      .map((item) => item.message)
      .join("; ");

    return check(
      "fail",
      preview || "Catálogos RBAC divergentes — execute pnpm rbac:drift-check.",
    );
  }

  if (report.status === "passed_with_warnings") {
    const preview = report.mismatches
      .filter((item) => item.severity === "warning")
      .slice(0, 2)
      .map((item) => item.message)
      .join("; ");

    return check("warn", preview || "Drift check com alertas não bloqueantes.");
  }

  return check(
    "pass",
    "Edge, SQL seed e Permission.ts alinhados ao catálogo canônico.",
  );
}

export function formatRBACCatalogDriftCheckForRelease(repoRoot: string): string {
  const report = runRBACCatalogDriftCheck(repoRoot);
  return formatRBACCatalogDriftReport(report);
}
