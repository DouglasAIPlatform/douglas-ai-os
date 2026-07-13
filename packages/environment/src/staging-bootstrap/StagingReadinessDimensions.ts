import type { StagingTargetStatus } from "./StagingTargetManifest";
import type { StagingConfigurationSnapshot } from "./StagingConfigurationSnapshot";
import type { StagingReadinessCheckResult } from "./StagingReadinessReport";
import type { StagingRuntimeContext } from "./StagingReadinessEvaluator";

export type StagingTriState = boolean | "unknown";

export interface StagingReadinessDimensions {
  codebasePrepared: boolean;
  localConfigurationPrepared: boolean;
  remoteProjectConfigured: StagingTriState;
  migrationsApplied: StagingTriState;
  edgeFunctionAvailable: StagingTriState;
  remoteMissionPersistence: StagingTriState;
  realAuthActive: StagingTriState;
  activeProfilePresent: StagingTriState;
  persistenceFallbackActive: StagingTriState;
  runtimeValidated: boolean;
  humanApproved: boolean;
  finalStatus: StagingTargetStatus;
}

export interface ResolveStagingDimensionsInput {
  snapshot: StagingConfigurationSnapshot;
  checks: StagingReadinessCheckResult[];
  runtime?: StagingRuntimeContext;
  codebasePrepared?: boolean;
  envTemplatesPresent?: boolean;
}

function checkOutcome(
  checks: StagingReadinessCheckResult[],
  id: string,
): StagingReadinessCheckResult["outcome"] | undefined {
  return checks.find((item) => item.id === id)?.outcome;
}

function triStateFromCheck(
  outcome: StagingReadinessCheckResult["outcome"] | undefined,
): StagingTriState {
  if (outcome === undefined || outcome === "pending_runtime") {
    return "unknown";
  }
  return outcome === "pass";
}

export function resolveStagingReadinessDimensions(
  input: ResolveStagingDimensionsInput,
): StagingReadinessDimensions {
  const { snapshot, checks, runtime } = input;
  const isStaging = snapshot.effectiveEnvironment === "staging";

  const codebasePrepared = input.codebasePrepared ?? true;
  const localConfigurationPrepared =
    (input.envTemplatesPresent ?? true) &&
    (isStaging ? snapshot.supabaseConfigured : true);

  const remoteProjectConfigured: StagingTriState = isStaging
    ? snapshot.supabaseConfigured
      ? true
      : "unknown"
    : "unknown";

  const migrationsApplied = triStateFromCheck(
    runtime?.migrationsSyncKnown === true
      ? "pass"
      : runtime?.migrationsSyncKnown === false
        ? "fail"
        : checkOutcome(checks, "migrations_documented"),
  );

  const edgeFunctionAvailable = triStateFromCheck(
    runtime?.auditIngestAuthRequired === true
      ? "pass"
      : runtime?.edgeFunctionDeployed === true
        ? "pass"
        : runtime?.edgeFunctionDeployed === false
          ? "fail"
          : undefined,
  );

  const remoteMissionPersistence: StagingTriState =
    runtime?.remoteMissionPersistenceKnown === true
      ? runtime.remoteMissionPersistence === true
        ? true
        : false
      : "unknown";

  const realAuthActive = triStateFromCheck(checkOutcome(checks, "real_session"));
  const activeProfilePresent = triStateFromCheck(checkOutcome(checks, "active_profile"));

  const persistenceFallbackActive: StagingTriState =
    runtime?.persistenceFallbackActive === undefined
      ? "unknown"
      : runtime.persistenceFallbackActive;

  const runtimeChecksComplete = checks
    .filter((item) => item.scope === "runtime")
    .every((item) => item.outcome !== "pending_runtime" && item.outcome !== "fail");

  const runtimeValidated =
    isStaging &&
    runtimeChecksComplete &&
    realAuthActive === true &&
    activeProfilePresent === true &&
    edgeFunctionAvailable === true &&
    migrationsApplied === true &&
    remoteMissionPersistence === true;

  const humanApproved = runtime?.humanReviewApproved === true;

  let finalStatus: StagingTargetStatus = "not_started";

  if (!codebasePrepared) {
    finalStatus = "not_started";
  } else if (!isStaging && codebasePrepared) {
    finalStatus = "configuration_prepared";
  } else if (codebasePrepared && !localConfigurationPrepared) {
    finalStatus = "configuration_prepared";
  } else if (isStaging && localConfigurationPrepared && remoteProjectConfigured !== true) {
    finalStatus = "remote_project_pending";
  } else if (remoteProjectConfigured === true && migrationsApplied !== true) {
    finalStatus = "migrations_pending";
  } else if (migrationsApplied === true && edgeFunctionAvailable !== true) {
    finalStatus = "edge_function_pending";
  } else if (!runtimeValidated) {
    finalStatus = "runtime_validation_pending";
  } else if (runtimeValidated && !humanApproved) {
    finalStatus = "runtime_validation_pending";
  } else if (runtimeValidated && humanApproved) {
    finalStatus = "ready";
  }

  return {
    codebasePrepared,
    localConfigurationPrepared,
    remoteProjectConfigured,
    migrationsApplied,
    edgeFunctionAvailable,
    remoteMissionPersistence,
    realAuthActive,
    activeProfilePresent,
    persistenceFallbackActive,
    runtimeValidated,
    humanApproved,
    finalStatus,
  };
}
