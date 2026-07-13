import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

export type StagingAcceptanceCheckOutcome = "pass" | "warn" | "fail" | "pending_runtime";

export type StagingAcceptanceCheckStatus =
  | "passed"
  | "passed_with_runtime_checks_pending"
  | "failed";

export interface StagingAcceptanceCheckResult {
  id: string;
  label: string;
  outcome: StagingAcceptanceCheckOutcome;
  message: string;
  scope: "static" | "runtime";
  blocking: boolean;
}

export interface StagingAcceptanceCheckReport {
  status: StagingAcceptanceCheckStatus;
  checkedAt: string;
  checks: StagingAcceptanceCheckResult[];
  passedChecks: StagingAcceptanceCheckResult[];
  pendingRuntimeChecks: StagingAcceptanceCheckResult[];
  blockingChecks: StagingAcceptanceCheckResult[];
  nextSteps: string[];
}

const DOC_ACCEPTANCE = "docs/operations/staging-persistence-acceptance.md";
const DOC_LIFECYCLE = "docs/architecture/persistence-rehydration-lifecycle.md";
const DOC_RECOVERY = "docs/operations/mission-recovery-runbook.md";

const REQUIRED_FILES = [
  "packages/missions/src/execution/persistence/acceptance/StagingPersistenceAcceptanceSuite.ts",
  "packages/missions/src/execution/persistence/acceptance/StagingPersistenceAcceptanceScenarios.ts",
  "packages/missions/src/execution/persistence/acceptance/AcceptanceReloadCheckpoint.ts",
  "packages/missions/src/execution/persistence/acceptance/MissionExecutionRecoveryPresentation.ts",
  "packages/missions/src/execution/persistence/acceptance/StagingPersistenceAcceptanceMetricsValidation.ts",
  "apps/headquarters/features/mission-control/useStagingPersistenceAcceptance.ts",
  DOC_ACCEPTANCE,
  DOC_LIFECYCLE,
  DOC_RECOVERY,
] as const;

const SCENARIO_IDS = [
  "system_diagnostics",
  "release_readiness",
  "recovery",
  "fallback_detection",
  "multi_agent_isolation",
] as const;

function staticResult(
  id: string,
  label: string,
  pass: boolean,
  passMessage: string,
  failMessage: string,
): StagingAcceptanceCheckResult {
  return {
    id,
    label,
    outcome: pass ? "pass" : "fail",
    message: pass ? passMessage : failMessage,
    scope: "static",
    blocking: true,
  };
}

function pendingRuntime(id: string, label: string, message: string): StagingAcceptanceCheckResult {
  return {
    id,
    label,
    outcome: "pending_runtime",
    message,
    scope: "runtime",
    blocking: false,
  };
}

export function runStagingAcceptanceStaticCheck(repoRoot: string): StagingAcceptanceCheckReport {
  const checks: StagingAcceptanceCheckResult[] = [];
  const checkedAt = new Date().toISOString();

  for (const relative of REQUIRED_FILES) {
    const id = `artifact_${relative.replace(/[^a-z0-9]/gi, "_")}`;
    checks.push(
      staticResult(
        id,
        `Artefato: ${relative}`,
        existsSync(join(repoRoot, relative)),
        "Presente.",
        "Ausente.",
      ),
    );
  }

  const scenariosPath = join(
    repoRoot,
    "packages/missions/src/execution/persistence/acceptance/StagingPersistenceAcceptanceScenarios.ts",
  );
  const scenariosContent = existsSync(scenariosPath)
    ? readFileSync(scenariosPath, "utf8")
    : "";
  for (const scenarioId of SCENARIO_IDS) {
    checks.push(
      staticResult(
        `scenario_${scenarioId}`,
        `Cenário ${scenarioId}`,
        scenariosContent.includes(`"${scenarioId}"`),
        "Definido.",
        "Ausente.",
      ),
    );
  }

  const suitePath = join(
    repoRoot,
    "packages/missions/src/execution/persistence/acceptance/StagingPersistenceAcceptanceSuite.ts",
  );
  const suiteContent = existsSync(suitePath) ? readFileSync(suitePath, "utf8") : "";
  checks.push(
    staticResult(
      "suite_no_auto_run",
      "Suite não executa automaticamente",
      suiteContent.includes("autoRun = false"),
      "autoRun = false confirmado.",
      "autoRun ausente ou habilitado.",
    ),
  );

  const checkpointPath = join(
    repoRoot,
    "packages/missions/src/execution/persistence/acceptance/AcceptanceReloadCheckpoint.ts",
  );
  const checkpointContent = existsSync(checkpointPath)
    ? readFileSync(checkpointPath, "utf8")
    : "";
  checks.push(
    staticResult(
      "reload_handshake",
      "Reload handshake presente",
      checkpointContent.includes("AcceptanceContinuationToken")
        && checkpointContent.includes("AcceptanceReloadCheckpoint"),
      "Token e checkpoint definidos.",
      "Reload handshake incompleto.",
    ),
  );

  const widgetPath = join(repoRoot, "apps/headquarters/components/widgets/MissionExecutionWidget.tsx");
  const widgetContent = readFileSync(widgetPath, "utf8");
  checks.push(
    staticResult(
      "hq_acceptance_widget",
      "Widget Staging Persistence Acceptance",
      widgetContent.includes("Staging Persistence Acceptance"),
      "Seção HQ presente.",
      "Widget ausente.",
    ),
  );

  const packageJson = readFileSync(join(repoRoot, "package.json"), "utf8");
  checks.push(
    staticResult(
      "staging_acceptance_script",
      "Script staging:acceptance:check",
      packageJson.includes('"staging:acceptance:check"'),
      "Script registrado.",
      "Script ausente em package.json.",
    ),
  );

  const testResult = spawnSync(
    "pnpm",
    [
      "exec",
      "vitest",
      "run",
      "packages/missions/src/execution/staging-persistence-acceptance.test.ts",
    ],
    { cwd: repoRoot, shell: true, encoding: "utf8" },
  );
  checks.push(
    staticResult(
      "acceptance_tests",
      "Testes acceptance passando",
      testResult.status === 0,
      "Testes passando.",
      `Testes falharam: ${testResult.stderr || testResult.stdout}`,
    ),
  );

  checks.push(
    pendingRuntime(
      "runtime_acceptance_staging",
      "Acceptance executada em staging real",
      "Execute no HQ staging após migration manual — não validado neste check estático.",
    ),
  );
  checks.push(
    pendingRuntime(
      "runtime_rehydration_proof",
      "Reidratação comprovada em runtime",
      "Recarregue HQ após acceptance e confirme execuções persistidas.",
    ),
  );

  const blockingChecks = checks.filter((c) => c.blocking && c.outcome === "fail");
  const passedChecks = checks.filter((c) => c.outcome === "pass");
  const pendingRuntimeChecks = checks.filter((c) => c.outcome === "pending_runtime");

  const status: StagingAcceptanceCheckStatus =
    blockingChecks.length > 0
      ? "failed"
      : pendingRuntimeChecks.length > 0
        ? "passed_with_runtime_checks_pending"
        : "passed";

  return {
    status,
    checkedAt,
    checks,
    passedChecks,
    pendingRuntimeChecks,
    blockingChecks,
    nextSteps: [
      "Configure projeto Supabase staging e aplique migration mission_executions manualmente.",
      "Deploy HQ com NEXT_PUBLIC_DOS_ENVIRONMENT=staging.",
      "Mission Control → Staging Persistence Acceptance → Iniciar acceptance.",
      "Recarregue HQ e use Retomar após reload quando checkpoint ativo.",
      `Documentação: ${DOC_ACCEPTANCE}`,
    ],
  };
}

export function formatStagingAcceptanceCheckReport(
  report: StagingAcceptanceCheckReport,
): string {
  const lines: string[] = [];
  lines.push("Douglas AI OS — Staging Persistence Acceptance Check");
  lines.push(`Status: ${report.status}`);
  lines.push(
    report.status === "passed_with_runtime_checks_pending"
      ? "Nota: checks estáticos aprovados — acceptance runtime ainda NÃO validada."
      : "",
  );
  lines.push(`Verificado em: ${report.checkedAt}`);
  lines.push("");
  lines.push(`Aprovados (${report.passedChecks.length})`);
  for (const item of report.passedChecks) {
    lines.push(`  ✓ ${item.label}`);
  }
  lines.push("");
  if (report.pendingRuntimeChecks.length > 0) {
    lines.push(`Runtime pendente (${report.pendingRuntimeChecks.length})`);
    for (const item of report.pendingRuntimeChecks) {
      lines.push(`  ○ ${item.label}: ${item.message}`);
    }
    lines.push("");
  }
  if (report.blockingChecks.length > 0) {
    lines.push(`Bloqueantes (${report.blockingChecks.length})`);
    for (const item of report.blockingChecks) {
      lines.push(`  ✗ ${item.label}: ${item.message}`);
    }
    lines.push("");
  }
  lines.push("Próximos passos");
  for (const step of report.nextSteps) {
    lines.push(`  • ${step}`);
  }
  return lines.filter(Boolean).join("\n");
}

export function runAndFormatStagingAcceptanceCheck(repoRoot: string): {
  report: StagingAcceptanceCheckReport;
  formatted: string;
} {
  const report = runStagingAcceptanceStaticCheck(repoRoot);
  return { report, formatted: formatStagingAcceptanceCheckReport(report) };
}
