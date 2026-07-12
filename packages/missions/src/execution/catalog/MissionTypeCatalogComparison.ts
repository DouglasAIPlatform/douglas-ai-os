import {
  createMissionTypeCatalogMismatch,
  type MissionTypeCatalogMismatch,
} from "./MissionTypeCatalogMismatch";
import {
  buildCanonicalMissionTypeCatalogSnapshot,
  isKnownPersistableMissionType,
  type MissionTypeCatalogSnapshot,
} from "./MissionTypeCatalogSnapshot";

export interface MissionTypeCatalogComparisonResult {
  sourceId: string;
  aligned: boolean;
  mismatches: MissionTypeCatalogMismatch[];
}

function diffSortedLists(
  expected: string[],
  actual: string[],
): { missing: string[]; extra: string[] } {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);

  return {
    missing: expected.filter((item) => !actualSet.has(item)),
    extra: actual.filter((item) => !expectedSet.has(item)),
  };
}

function rejectUnknownSqlTypes(
  sourceId: string,
  missionTypes: string[],
): MissionTypeCatalogMismatch[] {
  const mismatches: MissionTypeCatalogMismatch[] = [];

  for (const missionType of missionTypes) {
    if (!isKnownPersistableMissionType(missionType)) {
      mismatches.push(
        createMissionTypeCatalogMismatch(
          "sql_accepts_unknown",
          "error",
          sourceId,
          `SQL aceita mission type desconhecido "${missionType}".`,
          missionType,
        ),
      );
    }
  }

  return mismatches;
}

/** Compara um snapshot derivado contra o catálogo canônico. */
export function compareMissionTypeCatalogSnapshots(
  canonical: MissionTypeCatalogSnapshot,
  target: MissionTypeCatalogSnapshot,
): MissionTypeCatalogComparisonResult {
  if (target.sourceId === "canonical") {
    return { sourceId: target.sourceId, aligned: true, mismatches: [] };
  }

  const sourceId = target.sourceId;
  const mismatches: MissionTypeCatalogMismatch[] = [];
  const { missing, extra } = diffSortedLists(canonical.missionTypes, target.missionTypes);

  for (const missionType of missing) {
    mismatches.push(
      createMissionTypeCatalogMismatch(
        "mission_type_missing",
        "error",
        sourceId,
        `${sourceId}: mission type ausente "${missionType}" (presente no catálogo canônico).`,
        missionType,
      ),
    );
  }

  for (const missionType of extra) {
    mismatches.push(
      createMissionTypeCatalogMismatch(
        "mission_type_extra",
        "error",
        sourceId,
        `${sourceId}: mission type extra "${missionType}" sem entrada canônica.`,
        missionType,
      ),
    );
  }

  if (sourceId === "sql_migration") {
    mismatches.push(...rejectUnknownSqlTypes(sourceId, target.missionTypes));
  }

  const errors = mismatches.filter((item) => item.severity === "error");

  return {
    sourceId,
    aligned: errors.length === 0,
    mismatches,
  };
}

export function compareAllMissionTypeCatalogSnapshots(
  targets: MissionTypeCatalogSnapshot[],
): MissionTypeCatalogComparisonResult[] {
  const canonical = buildCanonicalMissionTypeCatalogSnapshot();
  return targets.map((target) => compareMissionTypeCatalogSnapshots(canonical, target));
}
