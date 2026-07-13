import type { MissionExecutionContext } from "../../MissionExecutionTypes";
import {
  OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
  RELEASE_READINESS_REVIEW_MISSION_TYPE,
  type PersistableMissionType,
} from "../../MissionExecutionTypes";
import { sanitizeMissionPersistenceText } from "../MissionExecutionSanitizer";

/** Prefixo de executionId para registros de acceptance — Sprint 5.54. */
export const MISSION_PERSISTENCE_ACCEPTANCE_PREFIX = "acceptance:";

/** Flag em metadata/correlation — identificável, não sensível. */
export const MISSION_PERSISTENCE_ACCEPTANCE_FLAG = "persistence_acceptance_test";

export interface MissionPersistenceTestDataPolicy {
  acceptancePrefix: typeof MISSION_PERSISTENCE_ACCEPTANCE_PREFIX;
  acceptanceFlag: typeof MISSION_PERSISTENCE_ACCEPTANCE_FLAG;
  allowedMissionTypes: readonly PersistableMissionType[];
  autoDelete: false;
  sanitizeMetadata: true;
}

export const MISSION_PERSISTENCE_TEST_DATA_POLICY: MissionPersistenceTestDataPolicy = {
  acceptancePrefix: MISSION_PERSISTENCE_ACCEPTANCE_PREFIX,
  acceptanceFlag: MISSION_PERSISTENCE_ACCEPTANCE_FLAG,
  allowedMissionTypes: [
    OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
    RELEASE_READINESS_REVIEW_MISSION_TYPE,
  ],
  autoDelete: false,
  sanitizeMetadata: true,
};

export function isAcceptanceExecutionId(executionId: string): boolean {
  return executionId.startsWith(MISSION_PERSISTENCE_ACCEPTANCE_PREFIX);
}

export function buildAcceptanceCorrelationId(stamp = Date.now()): string {
  return sanitizeMissionPersistenceText(`${MISSION_PERSISTENCE_ACCEPTANCE_FLAG}:${stamp}`)
    ?? MISSION_PERSISTENCE_ACCEPTANCE_FLAG;
}

export function buildAcceptanceExecutionId(
  missionType: string,
  stamp = Date.now(),
): string {
  const safeType = missionType.replace(/[^a-z0-9_]/gi, "").slice(0, 40);
  return `${MISSION_PERSISTENCE_ACCEPTANCE_PREFIX}${safeType}:${stamp}`;
}

export function buildAcceptanceMissionContext(input: {
  missionType: PersistableMissionType | string;
  createdBy: string;
  createdByUserId: string;
  createdByRole: MissionExecutionContext["request"]["createdByRole"];
  stamp?: number;
}): MissionExecutionContext {
  const stamp = input.stamp ?? Date.now();
  const executionId = buildAcceptanceExecutionId(input.missionType, stamp);
  const correlationId = buildAcceptanceCorrelationId(stamp);

  return {
    request: {
      executionId,
      correlationId,
      requestId: `req:${stamp}`,
      createdBy: sanitizeMissionPersistenceText(input.createdBy) ?? "operator",
      createdByRole: input.createdByRole,
      missionType: input.missionType,
      title: sanitizeMissionPersistenceText(`Acceptance ${input.missionType}`) ?? "Acceptance",
      createdByUserId: input.createdByUserId,
    },
    status: "created",
    missionId: `mission:${executionId}`,
    executionId,
    correlationId,
    requestId: `req:${stamp}`,
    createdBy: sanitizeMissionPersistenceText(input.createdBy) ?? "operator",
    createdByUserId: input.createdByUserId,
    progress: 0,
    attempt: 1,
    resultSummary:
      sanitizeMissionPersistenceText(MISSION_PERSISTENCE_ACCEPTANCE_FLAG)
      ?? MISSION_PERSISTENCE_ACCEPTANCE_FLAG,
  };
}

export function assertAcceptanceMissionTypeAllowed(missionType: string): boolean {
  return (MISSION_PERSISTENCE_TEST_DATA_POLICY.allowedMissionTypes as readonly string[]).includes(
    missionType,
  );
}
