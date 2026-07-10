/**
 * Sprint 5.37 / 5.40 — Release Readiness Pipeline (CLI).
 *
 * Read-only: não modifica arquivos de release, não conecta ao banco, não faz deploy.
 * Persiste cache em .release/last-readiness.json para pnpm release:status.
 *
 * Uso: pnpm release:check
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  RELEASE_READINESS_STATUS_DESCRIPTIONS,
  RELEASE_READINESS_STATUS_LABELS,
} from "./release-readiness/ReleaseReadinessStatus.ts";
import {
  formatReleaseReadinessReport,
  runReleaseReadiness,
} from "./release-readiness/ReleaseReadinessRunner.ts";
import { RELEASE_READINESS_CACHE_PATH } from "./release-versioning/ReadinessCache.ts";

const repoRoot = join(fileURLToPath(import.meta.url), "..", "..");

const report = runReleaseReadiness({ repoRoot });

console.log(formatReleaseReadinessReport(report, repoRoot));
console.log("");
console.log(
  `${RELEASE_READINESS_STATUS_LABELS[report.status]} — ${RELEASE_READINESS_STATUS_DESCRIPTIONS[report.status]}`,
);

const cacheDir = join(repoRoot, ".release");
mkdirSync(cacheDir, { recursive: true });
writeFileSync(
  join(repoRoot, RELEASE_READINESS_CACHE_PATH),
  `${JSON.stringify(
    {
      status: report.status,
      checkedAt: report.checkedAt,
      passedCount: report.passedChecks.length,
      warningCount: report.warningChecks.length,
      blockingCount: report.blockingChecks.length,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

if (report.status === "failed") {
  process.exitCode = 1;
}
