import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import type { ReleaseReadinessCheck } from "./ReleaseReadinessCheck.ts";
import { RELEASE_READINESS_CHECK_LABELS } from "./ReleaseReadinessCheck.ts";

const DOC_HISTORY = "docs/agents/agent-execution-history.md";
const DOC_METRICS = "docs/architecture/agent-metrics.md";
const DOC_RUNBOOK = "docs/operations/agent-history-runbook.md";

function check(
  id: keyof typeof RELEASE_READINESS_CHECK_LABELS,
  outcome: ReleaseReadinessCheck["outcome"],
  message: string,
  docPath?: string,
): ReleaseReadinessCheck {
  return {
    id,
    label: RELEASE_READINESS_CHECK_LABELS[id],
    outcome,
    message,
    blocking: true,
    docPath,
  };
}

export function checkAgentExecutionHistoryRepositoryPresent(
  repoRoot: string,
): ReleaseReadinessCheck {
  const path = join(
    repoRoot,
    "packages/missions/src/execution/history/AgentExecutionHistoryRepositoryImpl.ts",
  );
  if (!existsSync(path)) {
    return check("agent_execution_history_repository_present", "fail", "Repository de histórico ausente.");
  }

  const content = readFileSync(path, "utf8");
  if (
    !content.includes("CompositeAgentExecutionHistoryRepository") ||
    !content.includes("createCompositeAgentExecutionHistoryRepository")
  ) {
    return check("agent_execution_history_repository_present", "fail", "Repository composite incompleto.");
  }

  return check(
    "agent_execution_history_repository_present",
    "pass",
    "AgentExecutionHistoryRepository presente.",
    DOC_HISTORY,
  );
}

export function checkAgentExecutionMetricsCalculatorPresent(
  repoRoot: string,
): ReleaseReadinessCheck {
  const path = join(
    repoRoot,
    "packages/agents/src/history/AgentExecutionMetricsCalculator.ts",
  );
  if (!existsSync(path)) {
    return check("agent_execution_metrics_calculator_present", "fail", "Metrics calculator ausente.");
  }

  const content = readFileSync(path, "utf8");
  if (
    !content.includes("calculateAgentExecutionMetrics") ||
    !content.includes("insufficientSample")
  ) {
    return check("agent_execution_metrics_calculator_present", "fail", "Metrics calculator incompleto.");
  }

  return check(
    "agent_execution_metrics_calculator_present",
    "pass",
    "AgentExecutionMetricsCalculator presente.",
    DOC_METRICS,
  );
}

export function checkAgentExecutionPaginationPresent(repoRoot: string): ReleaseReadinessCheck {
  const retention = join(
    repoRoot,
    "packages/agents/src/history/AgentExecutionRetentionPolicy.ts",
  );
  if (!existsSync(retention)) {
    return check("agent_execution_pagination_present", "fail", "Retention policy ausente.");
  }

  const content = readFileSync(retention, "utf8");
  if (!content.includes("resolvePageLimit") || !content.includes("defaultPageSize")) {
    return check("agent_execution_pagination_present", "fail", "Paginação incompleta.");
  }

  return check("agent_execution_pagination_present", "pass", "Paginação e limites presentes.", DOC_HISTORY);
}

export function checkAgentExecutionRetentionPolicyPresent(
  repoRoot: string,
): ReleaseReadinessCheck {
  const path = join(
    repoRoot,
    "packages/agents/src/history/AgentExecutionRetentionPolicy.ts",
  );
  if (!existsSync(path)) {
    return check("agent_execution_retention_policy_present", "fail", "Retention policy ausente.");
  }

  const content = readFileSync(path, "utf8");
  if (!content.includes("truncateToRetentionLimit")) {
    return check("agent_execution_retention_policy_present", "fail", "Retention policy incompleta.");
  }

  return check(
    "agent_execution_retention_policy_present",
    "pass",
    "AgentExecutionRetentionPolicy presente.",
    DOC_RUNBOOK,
  );
}

export function checkAgentsPageHistoryIntegrated(repoRoot: string): ReleaseReadinessCheck {
  const path = join(repoRoot, "apps/headquarters/features/agents/AgentsPageContent.tsx");
  if (!existsSync(path)) {
    return check("agents_page_history_integrated", "fail", "AgentsPageContent ausente.");
  }

  const content = readFileSync(path, "utf8");
  if (
    !content.includes("useAgentExecutionHistory") ||
    !content.includes("Histórico de execuções")
  ) {
    return check("agents_page_history_integrated", "fail", "Agents page sem histórico integrado.");
  }

  const widget = join(
    repoRoot,
    "apps/headquarters/components/widgets/AgentExecutionHistoryWidget.tsx",
  );
  if (!existsSync(widget)) {
    return check("agents_page_history_integrated", "fail", "AgentExecutionHistoryWidget ausente.");
  }

  return check("agents_page_history_integrated", "pass", "Agents page e widget integrados.", DOC_HISTORY);
}

export function runAgentExecutionHistoryTests(repoRoot: string): ReleaseReadinessCheck {
  const result = spawnSync(
    "pnpm",
    ["exec", "vitest", "run", "packages/missions/src/execution/history/agent-execution-history.test.ts"],
    {
      cwd: repoRoot,
      shell: true,
      encoding: "utf8",
    },
  );

  if (result.status !== 0) {
    return check(
      "agent_execution_history_tests_passing",
      "fail",
      `Testes agent history falharam: ${result.stderr || result.stdout}`,
    );
  }

  return check("agent_execution_history_tests_passing", "pass", "Testes agent execution history passando.");
}

export function checkAgentExecutionHistoryDocsPresent(repoRoot: string): ReleaseReadinessCheck {
  const missing = [DOC_HISTORY, DOC_METRICS, DOC_RUNBOOK].filter(
    (doc) => !existsSync(join(repoRoot, doc)),
  );
  if (missing.length) {
    return check(
      "agent_execution_history_docs_present",
      "fail",
      `Documentação ausente: ${missing.join(", ")}`,
    );
  }
  return check("agent_execution_history_docs_present", "pass", "Docs agent history presentes.", DOC_HISTORY);
}

export function checkAgentHistoryEventsTyped(repoRoot: string): ReleaseReadinessCheck {
  const typedEvents = join(repoRoot, "packages/events/src/TypedEvents.ts");
  const content = readFileSync(typedEvents, "utf8");
  const required = [
    "agent:history_rehydrated",
    "agent:metrics_updated",
    "agent:history_load_failed",
  ];
  const missing = required.filter((topic) => !content.includes(`"${topic}"`));
  if (missing.length) {
    return check(
      "agent_history_events_typed",
      "fail",
      `Eventos agent history ausentes: ${missing.join(", ")}`,
    );
  }
  return check("agent_history_events_typed", "pass", "Eventos agent:history_* tipados.");
}
