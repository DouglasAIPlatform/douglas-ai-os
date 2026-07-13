import { sanitizeMissionPersistenceText } from "../MissionExecutionSanitizer";
import type { StagingPersistenceAcceptanceScenarioId } from "./StagingPersistenceAcceptanceTypes";

/** Prefixo sessionStorage — controle de teste, sem secrets. */
export const STAGING_ACCEPTANCE_CHECKPOINT_STORAGE_KEY =
  "douglas:staging-persistence-acceptance:checkpoint";

/** TTL padrão do token de continuação — 30 minutos. */
export const ACCEPTANCE_CONTINUATION_TTL_MS = 30 * 60 * 1000;

const SENSITIVE_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/,
  /service_role/i,
  /supabase\.co/i,
  /anon[_-]?key/i,
];

export interface AcceptanceContinuationToken {
  suiteRunId: string;
  scenarioId: StagingPersistenceAcceptanceScenarioId;
  stepIndex: number;
  executionIds: string[];
  status: "awaiting_reload" | "ready_to_resume";
  expiresAt: string;
  sanitized: true;
}

export interface AcceptanceContinuationState {
  token: AcceptanceContinuationToken;
  savedAt: string;
  requiresExplicitResume: boolean;
}

export interface AcceptanceReloadCheckpoint {
  runId: string;
  scenarioId: StagingPersistenceAcceptanceScenarioId;
  nextStepIndex: number;
  executionIds: string[];
  awaitingReload: boolean;
  expiresAt: string;
  summary: string;
}

function isBrowserStorageAvailable(): boolean {
  return typeof globalThis !== "undefined" && "sessionStorage" in globalThis;
}

export function sanitizeAcceptanceCheckpointValue(value: string): string {
  let next = sanitizeMissionPersistenceText(value) ?? value;
  for (const pattern of SENSITIVE_PATTERNS) {
    next = next.replace(pattern, "[redacted]");
  }
  return next.slice(0, 120);
}

export function assertAcceptanceTokenSanitized(token: AcceptanceContinuationToken): boolean {
  const serialized = JSON.stringify(token);
  return !SENSITIVE_PATTERNS.some((pattern) => pattern.test(serialized));
}

export function buildAcceptanceContinuationToken(input: {
  suiteRunId: string;
  scenarioId: StagingPersistenceAcceptanceScenarioId;
  stepIndex: number;
  executionIds?: string[];
  status?: AcceptanceContinuationToken["status"];
  ttlMs?: number;
}): AcceptanceContinuationToken {
  const expiresAt = new Date(
    Date.now() + (input.ttlMs ?? ACCEPTANCE_CONTINUATION_TTL_MS),
  ).toISOString();

  const token: AcceptanceContinuationToken = {
    suiteRunId: sanitizeAcceptanceCheckpointValue(input.suiteRunId),
    scenarioId: input.scenarioId,
    stepIndex: input.stepIndex,
    executionIds: (input.executionIds ?? []).map((id) =>
      sanitizeAcceptanceCheckpointValue(id),
    ),
    status: input.status ?? "awaiting_reload",
    expiresAt,
    sanitized: true,
  };

  return token;
}

export function isAcceptanceContinuationExpired(token: AcceptanceContinuationToken): boolean {
  const expires = Date.parse(token.expiresAt);
  return Number.isNaN(expires) || Date.now() > expires;
}

export function buildAcceptanceReloadCheckpoint(
  token: AcceptanceContinuationToken,
  summary: string,
): AcceptanceReloadCheckpoint {
  return {
    runId: token.suiteRunId,
    scenarioId: token.scenarioId,
    nextStepIndex: token.stepIndex,
    executionIds: token.executionIds,
    awaitingReload: token.status === "awaiting_reload",
    expiresAt: token.expiresAt,
    summary: sanitizeAcceptanceCheckpointValue(summary),
  };
}

export function saveAcceptanceContinuationState(state: AcceptanceContinuationState): boolean {
  if (!isBrowserStorageAvailable()) return false;
  if (!assertAcceptanceTokenSanitized(state.token)) return false;
  try {
    sessionStorage.setItem(
      STAGING_ACCEPTANCE_CHECKPOINT_STORAGE_KEY,
      JSON.stringify(state),
    );
    return true;
  } catch {
    return false;
  }
}

export function loadAcceptanceContinuationState(): AcceptanceContinuationState | null {
  if (!isBrowserStorageAvailable()) return null;
  try {
    const raw = sessionStorage.getItem(STAGING_ACCEPTANCE_CHECKPOINT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AcceptanceContinuationState;
    if (!parsed?.token || isAcceptanceContinuationExpired(parsed.token)) {
      clearAcceptanceContinuationState();
      return null;
    }
    if (!assertAcceptanceTokenSanitized(parsed.token)) {
      clearAcceptanceContinuationState();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearAcceptanceContinuationState(): void {
  if (!isBrowserStorageAvailable()) return;
  try {
    sessionStorage.removeItem(STAGING_ACCEPTANCE_CHECKPOINT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Snapshot sanitizado para Production Safety Gate — Sprint 5.55. */
export interface StagingAcceptanceSafetySnapshot {
  lastReportStatus: string | null;
  remotePersistenceValidated: boolean | null;
  rehydrationValidated: boolean | null;
  interruptedRecoveryValidated: boolean | null;
  diagnosticsHistoryValidated: boolean | null;
  releaseHistoryValidated: boolean | null;
  multiAgentIsolationValidated: boolean | null;
  fallbackInactiveInStaging: boolean | null;
}

export function readStagingAcceptanceSafetySnapshot(): StagingAcceptanceSafetySnapshot {
  const state = loadAcceptanceContinuationState();
  const stored = isBrowserStorageAvailable()
    ? sessionStorage.getItem(`${STAGING_ACCEPTANCE_CHECKPOINT_STORAGE_KEY}:report`)
    : null;

  let reportStatus: string | null = null;
  let scenarioResults: Partial<Record<StagingPersistenceAcceptanceScenarioId, string>> = {};

  if (stored) {
    try {
      const parsed = JSON.parse(stored) as {
        status?: string;
        scenarios?: Array<{ id: StagingPersistenceAcceptanceScenarioId; status: string }>;
      };
      reportStatus = parsed.status ?? null;
      for (const scenario of parsed.scenarios ?? []) {
        scenarioResults[scenario.id] = scenario.status;
      }
    } catch {
      reportStatus = null;
    }
  }

  const passed = (id: StagingPersistenceAcceptanceScenarioId) =>
    scenarioResults[id] === "passed" ? true : scenarioResults[id] ? false : null;

  return {
    lastReportStatus: reportStatus ?? (state ? "running" : null),
    remotePersistenceValidated: passed("system_diagnostics"),
    rehydrationValidated:
      passed("system_diagnostics") === true || passed("release_readiness") === true
        ? passed("system_diagnostics") && passed("release_readiness")
          ? true
          : passed("system_diagnostics") ?? passed("release_readiness")
        : null,
    interruptedRecoveryValidated: passed("recovery"),
    diagnosticsHistoryValidated: passed("system_diagnostics"),
    releaseHistoryValidated: passed("release_readiness"),
    multiAgentIsolationValidated: passed("multi_agent_isolation"),
    fallbackInactiveInStaging:
      scenarioResults.fallback_detection === "passed"
        ? true
        : scenarioResults.fallback_detection === "blocked"
          ? false
          : null,
  };
}

export function saveAcceptanceReportSnapshot(report: {
  status: string;
  scenarios: Array<{ id: StagingPersistenceAcceptanceScenarioId; status: string }>;
}): void {
  if (!isBrowserStorageAvailable()) return;
  try {
    sessionStorage.setItem(
      `${STAGING_ACCEPTANCE_CHECKPOINT_STORAGE_KEY}:report`,
      JSON.stringify({ status: report.status, scenarios: report.scenarios }),
    );
  } catch {
    // ignore
  }
}
