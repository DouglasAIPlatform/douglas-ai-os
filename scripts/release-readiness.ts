/**
 * Sprint 5.37 — Release Readiness Pipeline (CLI).
 *
 * Read-only: não modifica arquivos, não conecta ao banco, não aplica migrations, não faz deploy.
 *
 * Uso: pnpm release:check
 */

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

const repoRoot = join(fileURLToPath(import.meta.url), "..", "..");

const report = runReleaseReadiness({ repoRoot });

console.log(formatReleaseReadinessReport(report, repoRoot));
console.log("");
console.log(
  `${RELEASE_READINESS_STATUS_LABELS[report.status]} — ${RELEASE_READINESS_STATUS_DESCRIPTIONS[report.status]}`,
);

if (report.status === "failed") {
  process.exitCode = 1;
}
