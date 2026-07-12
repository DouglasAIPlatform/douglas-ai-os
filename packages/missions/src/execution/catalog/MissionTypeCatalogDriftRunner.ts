import { compareAllMissionTypeCatalogSnapshots } from "./MissionTypeCatalogComparison";
import {
  buildAccessPolicyMissionTypeSnapshot,
  buildCanonicalMissionTypeCatalogSnapshot,
  buildExecutorRegistryMissionTypeSnapshot,
  buildHeadquartersWidgetMissionTypeSnapshot,
  buildSqlMigrationMissionTypeSnapshot,
  type MissionTypeCatalogSnapshot,
} from "./MissionTypeCatalogSnapshot";
import {
  buildMissionTypeCatalogDriftReport,
  formatMissionTypeCatalogDriftReport,
  type MissionTypeCatalogDriftReport,
} from "./MissionTypeCatalogDriftReport";

export interface MissionTypeCatalogDriftInput {
  migrationContent?: string;
  headquartersWidgetContent?: string;
  extraSnapshots?: MissionTypeCatalogSnapshot[];
}

export function runMissionTypeCatalogDriftCheck(
  input: MissionTypeCatalogDriftInput = {},
): MissionTypeCatalogDriftReport {
  const canonical = buildCanonicalMissionTypeCatalogSnapshot();
  const targets = [
    buildAccessPolicyMissionTypeSnapshot(),
    buildExecutorRegistryMissionTypeSnapshot(),
    ...(input.extraSnapshots ?? []),
  ];

  if (input.migrationContent !== undefined) {
    targets.push(buildSqlMigrationMissionTypeSnapshot(input.migrationContent));
  } else {
    targets.push({ sourceId: "sql_migration", missionTypes: [] });
  }

  if (input.headquartersWidgetContent !== undefined) {
    targets.push(
      buildHeadquartersWidgetMissionTypeSnapshot(input.headquartersWidgetContent),
    );
  }

  const comparisons = compareAllMissionTypeCatalogSnapshots(targets);
  return buildMissionTypeCatalogDriftReport(comparisons, canonical.missionTypes);
}

export function formatMissionTypeCatalogDriftCheckResult(
  report: MissionTypeCatalogDriftReport,
): string {
  return formatMissionTypeCatalogDriftReport(report);
}
