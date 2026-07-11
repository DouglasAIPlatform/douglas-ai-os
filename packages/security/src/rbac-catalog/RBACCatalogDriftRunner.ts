import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { compareRBACCatalogSnapshots } from "./RBACCatalogComparison.ts";
import {
  buildRBACCatalogDriftReport,
  formatRBACCatalogDriftReport,
  type RBACCatalogDriftReport,
} from "./RBACCatalogDriftReport.ts";
import { createRBACCatalogMismatch } from "./RBACCatalogMismatch.ts";
import {
  buildCanonicalRBACCatalogSnapshot,
  buildRBACCatalogSnapshot,
  catalogDocumentPathHint,
  expectedSqlSeedMigrationFiles,
  type RBACCatalogSnapshot,
} from "./RBACCatalogSnapshot.ts";

export const EDGE_PERMISSION_CATALOG_FILE =
  "supabase/functions/audit-ingest/ServerPermissionCatalog.ts";

const KNOWN_ROLES = ["viewer", "operator", "admin", "owner"] as const;

function extractStringLiterals(block: string): string[] {
  const matches = block.match(/"([^"]+)"/g) ?? [];
  return matches.map((item) => item.slice(1, -1));
}

function parseEdgeRolePermissions(content: string): Record<string, string[]> {
  const rolePermissions: Record<string, string[]> = {};
  const blockMatch = content.match(
    /SERVER_ROLE_PERMISSIONS\s*:\s*Record<[^>]+>\s*=\s*\{([\s\S]*?)\n\};/,
  );

  if (!blockMatch) {
    return rolePermissions;
  }

  const block = blockMatch[1];

  for (const role of KNOWN_ROLES) {
    const roleBlockMatch = block.match(new RegExp(`${role}:\\s*\\[([\\s\\S]*?)\\],`, "m"));
    if (!roleBlockMatch) {
      continue;
    }

    const roleBlock = roleBlockMatch[1];
    let permissions = extractStringLiterals(roleBlock);

    if (roleBlock.includes("...OWNER_EXCLUSIVE_PERMISSIONS")) {
      permissions = [...permissions, ...parseEdgeOwnerExclusive(content)];
    }

    rolePermissions[role] = permissions;
  }

  return rolePermissions;
}

function parseEdgeOwnerExclusive(content: string): string[] {
  const match = content.match(
    /OWNER_EXCLUSIVE_PERMISSIONS\s*:\s*[^=]+=\s*\[([\s\S]*?)\];/,
  );
  if (!match) {
    return [];
  }
  return extractStringLiterals(match[1]);
}

export function parseEdgePermissionCatalog(content: string): RBACCatalogSnapshot {
  const ownerExclusive = parseEdgeOwnerExclusive(content);
  const rolePermissions = parseEdgeRolePermissions(content);

  return buildRBACCatalogSnapshot("edge", rolePermissions, ownerExclusive);
}

function extractSqlInsertTuples(content: string): Array<{ role: string; permission: string }> {
  const tuples: Array<{ role: string; permission: string }> = [];
  const insertBlocks = content.matchAll(
    /INSERT\s+INTO\s+public\.operator_role_permissions[\s\S]*?VALUES\s*([\s\S]*?)(?:ON\s+CONFLICT|;)/gi,
  );

  for (const block of insertBlocks) {
    const rowPattern = /\(\s*'(\w+)'\s*,\s*'([^']+)'/g;
    let match: RegExpExecArray | null;
    while ((match = rowPattern.exec(block[1])) !== null) {
      tuples.push({ role: match[1], permission: match[2] });
    }
  }

  return tuples;
}

export function parseSqlPermissionSeed(content: string): RBACCatalogSnapshot {
  const tuples = extractSqlInsertTuples(content);
  const rolePermissions: Record<string, string[]> = {
    viewer: [],
    operator: [],
    admin: [],
    owner: [],
  };

  for (const tuple of tuples) {
    if (!rolePermissions[tuple.role]) {
      rolePermissions[tuple.role] = [];
    }
    rolePermissions[tuple.role].push(tuple.permission);
  }

  const ownerExclusive = rolePermissions.owner.filter((permission) =>
    [
      "security:manage_roles",
      "security:manage_owners",
      "release:approve_production",
      "platform:critical_configuration",
    ].includes(permission),
  );

  return buildRBACCatalogSnapshot("sql_seed", rolePermissions, ownerExclusive);
}

export function loadSqlPermissionSeedSnapshot(repoRoot: string) {
  const migrationFiles = expectedSqlSeedMigrationFiles();
  let combined = "";

  for (const file of migrationFiles) {
    const path = join(repoRoot, "supabase", "migrations", file);
    if (!existsSync(path)) {
      return {
        snapshot: buildRBACCatalogSnapshot("sql_seed", {}, []),
        missingFiles: [file],
      };
    }
    combined += `${readFileSync(path, "utf8")}\n`;
  }

  return {
    snapshot: parseSqlPermissionSeed(combined),
    missingFiles: [] as string[],
  };
}

export function loadEdgePermissionCatalogSnapshot(repoRoot: string) {
  const path = join(repoRoot, EDGE_PERMISSION_CATALOG_FILE);

  if (!existsSync(path)) {
    return {
      snapshot: buildRBACCatalogSnapshot("edge", {}, []),
      missing: true,
    };
  }

  const content = readFileSync(path, "utf8");
  return {
    snapshot: parseEdgePermissionCatalog(content),
    missing: false,
  };
}

export function verifyPermissionTsExportsAligned(repoRoot: string): {
  passed: boolean;
  output: string;
} {
  const permissionPath = join(repoRoot, "packages/security/src/Permission.ts");

  if (!existsSync(permissionPath)) {
    return { passed: false, output: "Permission.ts ausente." };
  }

  const content = readFileSync(permissionPath, "utf8");

  if (!content.includes("rbac-catalog.json")) {
    return {
      passed: false,
      output: "Permission.ts não importa packages/security/rbac-catalog.json.",
    };
  }

  const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const result = spawnSync(
    pnpmCmd,
    [
      "exec",
      "vitest",
      "run",
      "--config",
      "vitest.config.ts",
      "packages/security/src/rbac-catalog/rbac-catalog-drift.rbac.test.ts",
      "-t",
      "canonical, client and server",
    ],
    { cwd: repoRoot, encoding: "utf8", shell: process.platform === "win32" },
  );

  return {
    passed: result.status === 0,
    output: [result.stdout, result.stderr].filter(Boolean).join("\n"),
  };
}

export function runRBACCatalogDriftCheck(repoRoot: string): RBACCatalogDriftReport {
  const canonical = buildCanonicalRBACCatalogSnapshot();
  const edgeLoad = loadEdgePermissionCatalogSnapshot(repoRoot);
  const sqlLoad = loadSqlPermissionSeedSnapshot(repoRoot);

  const comparisons = [
    compareRBACCatalogSnapshots(canonical, edgeLoad.snapshot),
    compareRBACCatalogSnapshots(canonical, sqlLoad.snapshot),
  ];

  const extraMismatches = [];

  if (edgeLoad.missing) {
    extraMismatches.push(
      createRBACCatalogMismatch(
        "permission_missing",
        "error",
        "edge",
        `Arquivo Edge ${EDGE_PERMISSION_CATALOG_FILE} ausente.`,
      ),
    );
  }

  for (const file of sqlLoad.missingFiles) {
    extraMismatches.push(
      createRBACCatalogMismatch(
        "sql_seed_incomplete",
        "error",
        "sql_seed",
        `Migration SQL ausente: ${file}.`,
      ),
    );
  }

  const permissionProbe =
    process.env.VITEST === "true"
      ? { passed: true, output: "" }
      : verifyPermissionTsExportsAligned(repoRoot);
  if (!permissionProbe.passed) {
    extraMismatches.push(
      createRBACCatalogMismatch(
        "permission_missing",
        "error",
        "client",
        "Permission.ts diverge do catálogo canônico ou não deriva de rbac-catalog.json.",
      ),
    );
  }

  const report = buildRBACCatalogDriftReport(comparisons, catalogDocumentPathHint());

  if (extraMismatches.length > 0) {
    report.mismatches.push(...extraMismatches);
    report.errorCount += extraMismatches.length;
    report.status = "failed";
  }

  return report;
}

export function runAndFormatRBACCatalogDriftCheck(
  repoRoot: string,
): {
  report: RBACCatalogDriftReport;
  formatted: string;
} {
  const report = runRBACCatalogDriftCheck(repoRoot);
  return {
    report,
    formatted: formatRBACCatalogDriftReport(report),
  };
}
