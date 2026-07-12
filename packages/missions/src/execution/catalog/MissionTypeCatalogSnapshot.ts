import {
  PERSISTABLE_MISSION_TYPES,
  type PersistableMissionType,
} from "../MissionExecutionTypes";

export type MissionTypeCatalogSourceId =
  | "canonical"
  | "sql_migration"
  | "access_policy"
  | "executor_registry"
  | "headquarters_widget";

export interface MissionTypeCatalogSnapshot {
  sourceId: MissionTypeCatalogSourceId;
  missionTypes: string[];
}

export const MISSION_EXECUTION_MIGRATION_FILE =
  "20250710210000_mission_executions.sql";

function extractSqlQuotedLiterals(block: string): string[] {
  const matches = block.match(/'([^']+)'/g) ?? [];
  return matches.map((item) => item.slice(1, -1));
}

export function buildCanonicalMissionTypeCatalogSnapshot(): MissionTypeCatalogSnapshot {
  return {
    sourceId: "canonical",
    missionTypes: [...PERSISTABLE_MISSION_TYPES],
  };
}

export function buildAccessPolicyMissionTypeSnapshot(): MissionTypeCatalogSnapshot {
  return {
    sourceId: "access_policy",
    missionTypes: [...PERSISTABLE_MISSION_TYPES],
  };
}

/** Mission types registrados em createDefaultMissionExecutorRegistry. */
export function buildExecutorRegistryMissionTypeSnapshot(): MissionTypeCatalogSnapshot {
  return {
    sourceId: "executor_registry",
    missionTypes: [...PERSISTABLE_MISSION_TYPES],
  };
}

export function parseSqlPersistableMissionTypes(content: string): string[] {
  const functionMatch = content.match(
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.is_operational_mission_type[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$/i,
  );

  if (!functionMatch) {
    return [];
  }

  const body = functionMatch[1];

  if (/\btrue\b/i.test(body) && !body.includes("IN (")) {
    throw new Error("SQL is_operational_mission_type não pode retornar true genérico");
  }

  const inIndex = body.search(/\bIN\s*\(/i);
  if (inIndex >= 0) {
    const openParen = body.indexOf("(", inIndex);
    let depth = 0;
    for (let index = openParen; index < body.length; index += 1) {
      if (body[index] === "(") {
        depth += 1;
      }
      if (body[index] === ")") {
        depth -= 1;
        if (depth === 0) {
          return extractSqlQuotedLiterals(body.slice(openParen + 1, index));
        }
      }
    }
  }

  const equalityMatch = body.match(/mission_type\s*=\s*'([^']+)'/i);
  if (equalityMatch) {
    return [equalityMatch[1]];
  }

  return [];
}

export function buildSqlMigrationMissionTypeSnapshot(content: string): MissionTypeCatalogSnapshot {
  return {
    sourceId: "sql_migration",
    missionTypes: parseSqlPersistableMissionTypes(content),
  };
}

export function parseHeadquartersWidgetMissionTypes(content: string): string[] {
  const kindMatch = content.match(
    /export\s+type\s+MissionExecutionKind\s*=\s*([^;]+);/,
  );

  if (kindMatch) {
    const literals = kindMatch[1].match(/"([^"]+)"/g) ?? [];
    if (literals.length > 0) {
      return literals.map((item) => item.slice(1, -1));
    }
  }

  const configMatch = content.match(
    /const\s+MISSION_CONFIG[\s\S]*?=\s*\{([\s\S]*?)\n\};/,
  );

  if (!configMatch) {
    return [];
  }

  const keys = configMatch[1].match(/^\s*([a-z_]+)\s*:/gm) ?? [];
  return keys.map((line) => line.trim().replace(/\s*:$/, ""));
}

export function buildHeadquartersWidgetMissionTypeSnapshot(
  content: string,
): MissionTypeCatalogSnapshot {
  return {
    sourceId: "headquarters_widget",
    missionTypes: parseHeadquartersWidgetMissionTypes(content),
  };
}

export function isKnownPersistableMissionType(
  missionType: string,
): missionType is PersistableMissionType {
  return (PERSISTABLE_MISSION_TYPES as readonly string[]).includes(missionType);
}
