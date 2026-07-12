import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import type { ReleaseReadinessCheck } from "./ReleaseReadinessCheck.ts";
import { RELEASE_READINESS_CHECK_LABELS } from "./ReleaseReadinessCheck.ts";

const DOC_PATH = "docs/architecture/mission-persistence.md";
const MIGRATION_FILE = "20250710210000_mission_executions.sql";
const HQ_HOOK = "apps/headquarters/features/mission-control/useMissionExecution.ts";
const TYPES_FILE = "packages/missions/src/execution/MissionExecutionTypes.ts";
const ACCESS_POLICY_FILE = "packages/missions/src/execution/MissionExecutionAccessPolicy.ts";
const EXECUTOR_FILE = "packages/missions/src/execution/DiagnosticMissionExecutor.ts";

function check(
  outcome: ReleaseReadinessCheck["outcome"],
  message: string,
): ReleaseReadinessCheck {
  return {
    id: "mission_type_catalog_aligned",
    label: RELEASE_READINESS_CHECK_LABELS.mission_type_catalog_aligned,
    outcome,
    message,
    blocking: true,
    docPath: DOC_PATH,
  };
}

function extractQuotedLiterals(block: string): string[] {
  const matches = block.match(/"([^"]+)"/g) ?? [];
  return matches.map((item) => item.slice(1, -1));
}

function extractSqlQuotedLiterals(block: string): string[] {
  const matches = block.match(/'([^']+)'/g) ?? [];
  return matches.map((item) => item.slice(1, -1));
}

export function parsePersistableMissionTypesFromSource(content: string): string[] {
  const match = content.match(/PERSISTABLE_MISSION_TYPES\s*=\s*\[([\s\S]*?)\]\s*as\s*const/);
  if (!match) {
    return [];
  }
  return extractQuotedLiterals(match[1]);
}

export function parseSqlPersistableMissionTypes(content: string): string[] {
  const functionMatch = content.match(
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.is_operational_mission_type[\s\S]*?AS\s+\$\$([\s\S]*?)\$\$/i,
  );

  if (!functionMatch) {
    return [];
  }

  const body = functionMatch[1];

  if (/\bSELECT\s+true\b/i.test(body)) {
    return ["__generic_true__"];
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

export function parseHeadquartersWidgetMissionTypes(content: string): string[] {
  const kindMatch = content.match(/export\s+type\s+MissionExecutionKind\s*=\s*([^;]+);/);
  if (kindMatch) {
    const literals = extractQuotedLiterals(kindMatch[1]);
    if (literals.length > 0) {
      return literals;
    }
  }

  const configMatch = content.match(/const\s+MISSION_CONFIG[\s\S]*?=\s*\{([\s\S]*?)\n\};/);
  if (!configMatch) {
    return [];
  }

  const keys = configMatch[1].match(/^\s*([a-z_]+)\s*:/gm) ?? [];
  return keys.map((line) => line.trim().replace(/\s*:$/, ""));
}

function resolveExecutorMissionTypes(
  diagnosticContent: string,
  releaseContent: string,
  registryContent: string,
): string[] {
  const types: string[] = [];

  if (diagnosticContent.includes("OPERATIONAL_DIAGNOSTIC_MISSION_TYPE")) {
    types.push("operational_diagnostic");
  }
  if (releaseContent.includes("RELEASE_READINESS_REVIEW_MISSION_TYPE")) {
    types.push("release_readiness_review");
  }

  if (
    !registryContent.includes("new DiagnosticMissionExecutor") ||
    !registryContent.includes("new ReleaseReadinessMissionExecutor")
  ) {
    return [];
  }

  return types;
}

function diffLists(expected: string[], actual: string[]): { missing: string[]; extra: string[] } {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);

  return {
    missing: expected.filter((item) => !actualSet.has(item)),
    extra: actual.filter((item) => !expectedSet.has(item)),
  };
}

export function checkMissionTypeCatalogAligned(repoRoot: string): ReleaseReadinessCheck {
  const issues: string[] = [];

  const typesPath = join(repoRoot, TYPES_FILE);
  const migrationPath = join(repoRoot, "supabase/migrations", MIGRATION_FILE);
  const hqPath = join(repoRoot, HQ_HOOK);
  const accessPath = join(repoRoot, ACCESS_POLICY_FILE);
  const diagnosticExecutorPath = join(repoRoot, EXECUTOR_FILE);
  const releaseExecutorPath = join(
    repoRoot,
    "packages/missions/src/execution/ReleaseReadinessMissionExecutor.ts",
  );

  if (!existsSync(typesPath) || !existsSync(migrationPath)) {
    return check("fail", "Arquivos canônicos de mission type ausentes.");
  }

  const canonical = parsePersistableMissionTypesFromSource(readFileSync(typesPath, "utf8"));
  if (canonical.length === 0) {
    return check("fail", "PERSISTABLE_MISSION_TYPES ausente em MissionExecutionTypes.");
  }

  const sqlTypes = parseSqlPersistableMissionTypes(readFileSync(migrationPath, "utf8"));
  if (sqlTypes.includes("__generic_true__")) {
    issues.push("SQL is_operational_mission_type retorna true genérico.");
  }

  const sqlDiff = diffLists(canonical, sqlTypes);
  for (const item of sqlDiff.missing) {
    issues.push(`SQL não reconhece mission type "${item}".`);
  }
  for (const item of sqlDiff.extra) {
    issues.push(`SQL aceita mission type desconhecido/extra "${item}".`);
  }

  if (existsSync(accessPath)) {
    const accessContent = readFileSync(accessPath, "utf8");
    if (!accessContent.includes("PERSISTABLE_MISSION_TYPES")) {
      issues.push("MissionExecutionAccessPolicy não referencia PERSISTABLE_MISSION_TYPES.");
    }
  }

  if (existsSync(diagnosticExecutorPath) && existsSync(releaseExecutorPath)) {
    const executorTypes = resolveExecutorMissionTypes(
      readFileSync(diagnosticExecutorPath, "utf8"),
      readFileSync(releaseExecutorPath, "utf8"),
      readFileSync(diagnosticExecutorPath, "utf8"),
    );
    const executorDiff = diffLists(canonical, executorTypes);
    for (const item of executorDiff.missing) {
      issues.push(`Executor ausente para mission type "${item}".`);
    }
    for (const item of executorDiff.extra) {
      issues.push(`Executor extra sem catálogo canônico "${item}".`);
    }
  }

  if (existsSync(hqPath)) {
    const widgetTypes = parseHeadquartersWidgetMissionTypes(readFileSync(hqPath, "utf8"));
    const widgetDiff = diffLists(canonical, widgetTypes);
    for (const item of widgetDiff.missing) {
      issues.push(`Headquarters widget não expõe mission type "${item}".`);
    }
    for (const item of widgetDiff.extra) {
      issues.push(`Headquarters widget expõe mission type extra "${item}".`);
    }
  }

  if (issues.length > 0) {
    return check("fail", issues.slice(0, 3).join("; "));
  }

  return check(
    "pass",
    `Catálogo alinhado (${canonical.join(", ")}).`,
  );
}

export function runMissionTypeCatalogDriftTests(repoRoot: string): ReleaseReadinessCheck {
  const result = spawnSync(
    "pnpm",
    [
      "vitest",
      "run",
      "packages/missions/src/execution/catalog/mission-type-catalog-drift.test.ts",
    ],
    { cwd: repoRoot, shell: true, encoding: "utf8" },
  );

  if (result.status !== 0) {
    return {
      id: "mission_type_catalog_tests_passing",
      label: RELEASE_READINESS_CHECK_LABELS.mission_type_catalog_tests_passing,
      outcome: "fail",
      message: "Testes mission type catalog drift falharam.",
      blocking: true,
      docPath: DOC_PATH,
    };
  }

  return {
    id: "mission_type_catalog_tests_passing",
    label: RELEASE_READINESS_CHECK_LABELS.mission_type_catalog_tests_passing,
    outcome: "pass",
    message: "Testes mission type catalog drift passando.",
    blocking: true,
    docPath: DOC_PATH,
  };
}

export function formatMissionTypeCatalogDriftCheckForRelease(repoRoot: string): string {
  const report = checkMissionTypeCatalogAligned(repoRoot);
  return `${report.label}: ${report.message}`;
}
