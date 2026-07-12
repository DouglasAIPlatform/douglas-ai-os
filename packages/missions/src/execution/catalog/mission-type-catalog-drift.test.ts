import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  canPerformMissionExecution,
  getOperatorExecutableMissionTypes,
  hasMissionExecutionAccessPolicy,
} from "../MissionExecutionAccessPolicy";
import {
  OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
  PERSISTABLE_MISSION_TYPES,
  RELEASE_READINESS_REVIEW_MISSION_TYPE,
  isPersistableMissionType,
} from "../MissionExecutionTypes";
import {
  MISSION_EXECUTION_MIGRATION_FILE,
  buildCanonicalMissionTypeCatalogSnapshot,
  buildSqlMigrationMissionTypeSnapshot,
  parseSqlPersistableMissionTypes,
  runMissionTypeCatalogDriftCheck,
} from "./index";

const repoRoot = join(
  fileURLToPath(import.meta.url),
  "..",
  "..",
  "..",
  "..",
  "..",
  "..",
);

describe("Mission type catalog drift guard (Patch 5.52.1)", () => {
  it("operational_diagnostic aceito pela aplicação e SQL", () => {
    expect(isPersistableMissionType(OPERATIONAL_DIAGNOSTIC_MISSION_TYPE)).toBe(true);
    expect(getOperatorExecutableMissionTypes()).toContain(OPERATIONAL_DIAGNOSTIC_MISSION_TYPE);

    const migrationPath = join(repoRoot, "supabase/migrations", MISSION_EXECUTION_MIGRATION_FILE);
    const content = readFileSync(migrationPath, "utf8");
    const sqlTypes = parseSqlPersistableMissionTypes(content);

    expect(sqlTypes).toContain(OPERATIONAL_DIAGNOSTIC_MISSION_TYPE);
  });

  it("release_readiness_review aceito pela aplicação e SQL", () => {
    expect(isPersistableMissionType(RELEASE_READINESS_REVIEW_MISSION_TYPE)).toBe(true);
    expect(getOperatorExecutableMissionTypes()).toContain(RELEASE_READINESS_REVIEW_MISSION_TYPE);

    const migrationPath = join(repoRoot, "supabase/migrations", MISSION_EXECUTION_MIGRATION_FILE);
    const content = readFileSync(migrationPath, "utf8");
    const sqlTypes = parseSqlPersistableMissionTypes(content);

    expect(sqlTypes).toContain(RELEASE_READINESS_REVIEW_MISSION_TYPE);
  });

  it("mission type desconhecido rejeitado pelo catálogo", () => {
    expect(isPersistableMissionType("unknown_mission_type")).toBe(false);
    expect(hasMissionExecutionAccessPolicy("unknown_mission_type")).toBe(false);

    expect(
      canPerformMissionExecution({
        role: "operator",
        missionType: "unknown_mission_type",
        capability: "execute",
      }),
    ).toBe(false);
  });

  it("todos os mission types possuem executor registrado", () => {
    const report = runMissionTypeCatalogDriftCheck({
      migrationContent: readFileSync(
        join(repoRoot, "supabase/migrations", MISSION_EXECUTION_MIGRATION_FILE),
        "utf8",
      ),
      headquartersWidgetContent: readFileSync(
        join(
          repoRoot,
          "apps/headquarters/features/mission-control/useMissionExecution.ts",
        ),
        "utf8",
      ),
    });
    const executorComparison = report.comparisons.find(
      (item) => item.sourceId === "executor_registry",
    );

    expect(executorComparison?.aligned).toBe(true);
  });

  it("todos os mission types possuem access policy", () => {
    for (const missionType of PERSISTABLE_MISSION_TYPES) {
      expect(hasMissionExecutionAccessPolicy(missionType)).toBe(true);
    }

    expect(getOperatorExecutableMissionTypes().sort()).toEqual(
      [...PERSISTABLE_MISSION_TYPES].sort(),
    );
  });

  it("SQL e catálogo TypeScript alinhados", () => {
    const migrationPath = join(repoRoot, "supabase/migrations", MISSION_EXECUTION_MIGRATION_FILE);
    const hqPath = join(
      repoRoot,
      "apps/headquarters/features/mission-control/useMissionExecution.ts",
    );

    const report = runMissionTypeCatalogDriftCheck({
      migrationContent: readFileSync(migrationPath, "utf8"),
      headquartersWidgetContent: readFileSync(hqPath, "utf8"),
    });

    expect(report.status).toBe("passed");
    expect(report.mismatches.filter((item) => item.severity === "error")).toHaveLength(0);

    const canonical = buildCanonicalMissionTypeCatalogSnapshot();
    const sqlSnapshot = buildSqlMigrationMissionTypeSnapshot(
      readFileSync(migrationPath, "utf8"),
    );

    expect(sqlSnapshot.missionTypes.sort()).toEqual([...canonical.missionTypes].sort());
  });

  it("operator pode persistir os dois tipos permitidos", () => {
    for (const missionType of PERSISTABLE_MISSION_TYPES) {
      expect(
        canPerformMissionExecution({
          role: "operator",
          missionType,
          capability: "execute",
        }),
      ).toBe(true);
    }
  });

  it("viewer não pode criar execuções", () => {
    for (const missionType of PERSISTABLE_MISSION_TYPES) {
      expect(
        canPerformMissionExecution({
          role: "viewer",
          missionType,
          capability: "execute",
        }),
      ).toBe(false);
    }

    expect(
      canPerformMissionExecution({
        role: "viewer",
        missionType: OPERATIONAL_DIAGNOSTIC_MISSION_TYPE,
        capability: "retry",
      }),
    ).toBe(false);
  });

  it("profile inativo continua bloqueado via require_active_operator na migration", () => {
    const migrationPath = join(repoRoot, "supabase/migrations", MISSION_EXECUTION_MIGRATION_FILE);
    expect(existsSync(migrationPath)).toBe(true);

    const content = readFileSync(migrationPath, "utf8");

    expect(content).toContain("require_active_operator()");
    expect(content).toMatch(
      /can_read_mission_execution_row[\s\S]*require_active_operator\(\)/,
    );
    expect(content).toMatch(
      /can_write_mission_execution_row[\s\S]*require_active_operator\(\)/,
    );
  });

  it("SQL não aceita tipos desconhecidos nem retorno genérico true", () => {
    const migrationPath = join(repoRoot, "supabase/migrations", MISSION_EXECUTION_MIGRATION_FILE);
    const content = readFileSync(migrationPath, "utf8");

    expect(content).not.toMatch(/SELECT\s+true/i);
    expect(content).toMatch(/IN\s*\(/);

    const sqlTypes = parseSqlPersistableMissionTypes(content);
    for (const missionType of sqlTypes) {
      expect(isPersistableMissionType(missionType)).toBe(true);
    }
  });

  it("headquarters widget alinhado ao catálogo canônico", () => {
    const report = runMissionTypeCatalogDriftCheck({
      migrationContent: readFileSync(
        join(repoRoot, "supabase/migrations", MISSION_EXECUTION_MIGRATION_FILE),
        "utf8",
      ),
      headquartersWidgetContent: readFileSync(
        join(
          repoRoot,
          "apps/headquarters/features/mission-control/useMissionExecution.ts",
        ),
        "utf8",
      ),
    });
    const widgetComparison = report.comparisons.find(
      (item) => item.sourceId === "headquarters_widget",
    );

    expect(widgetComparison?.aligned).toBe(true);
  });
});
