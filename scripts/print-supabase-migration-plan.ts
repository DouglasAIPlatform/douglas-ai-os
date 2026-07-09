/**
 * Sprint 5.23 — Plano informativo de migrations Supabase.
 *
 * NÃO aplica migrations. NÃO conecta ao banco remoto. NÃO lê env vars sensíveis.
 * Apenas lista arquivos em supabase/migrations/ na ordem lexicográfica (ordem de apply).
 *
 * Uso: pnpm supabase:migration-plan
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(fileURLToPath(import.meta.url), "..", "..");
const migrationsDir = join(repoRoot, "supabase", "migrations");

interface MigrationSummary {
  filename: string;
  order: number;
  tables: string[];
  rlsEnabled: boolean | null;
  notes: string[];
}

const MIGRATION_CATALOG: Record<string, Omit<MigrationSummary, "filename" | "order">> = {
  "20250707130000_platform_helpers.sql": {
    tables: [
      "operator_role_permissions",
      "(functions: current_auth_user_id, current_operator_role, has_platform_role, …)",
    ],
    rlsEnabled: true,
    notes: [
      "Enums: platform_operator_role, platform_operator_status, platform_session_status",
      "Seeds operator_role_permissions (mirror @douglas/security)",
      "current_operator_role() referencia operator_profiles (criada na migration seguinte)",
    ],
  },
  "20250707130001_operator_profiles.sql": {
    tables: ["operator_profiles"],
    rlsEnabled: true,
    notes: [
      "FK auth.users — alinhado a Auth Foundation (Sprint 5.21)",
      "INSERT inicial de owner requer service_role ou Dashboard (chicken-and-egg RLS)",
    ],
  },
  "20250707130002_operational_audit_entries.sql": {
    tables: ["operational_audit_entries"],
    rlsEnabled: true,
    notes: [
      "Alinhado a @douglas/audit / SupabaseAuditRowMapper",
      "INSERT negado para anon/authenticated — append via service_role/Edge Function",
      "Append-only: UPDATE/DELETE negados",
    ],
  },
  "20250707130003_operator_sessions.sql": {
    tables: ["operator_sessions"],
    rlsEnabled: true,
    notes: [
      "Futuro — session_token_hash apenas (nunca token raw)",
      "INSERT/UPDATE/DELETE negados no client",
    ],
  },
};

function extractTablesFromSql(sql: string): string[] {
  const matches = sql.match(/CREATE TABLE IF NOT EXISTS public\.(\w+)/g) ?? [];
  return matches.map((line) => line.replace("CREATE TABLE IF NOT EXISTS public.", ""));
}

function detectRls(sql: string): boolean | null {
  if (!sql.includes("ENABLE ROW LEVEL SECURITY")) return null;
  return sql.includes("ENABLE ROW LEVEL SECURITY");
}

function listMigrations(): MigrationSummary[] {
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  return files.map((filename, index) => {
    const sql = readFileSync(join(migrationsDir, filename), "utf8");
    const catalog = MIGRATION_CATALOG[filename];
    const tablesFromSql = extractTablesFromSql(sql);

    return {
      filename,
      order: index + 1,
      tables: catalog?.tables.length ? catalog.tables : tablesFromSql,
      rlsEnabled: catalog?.rlsEnabled ?? detectRls(sql),
      notes: catalog?.notes ?? [],
    };
  });
}

function printPlan(): void {
  const migrations = listMigrations();

  console.log("");
  console.log("Douglas AI Platform — Supabase Migration Plan (read-only)");
  console.log("=".repeat(60));
  console.log(`Repo: ${repoRoot}`);
  console.log(`Migrations dir: ${relative(repoRoot, migrationsDir)}`);
  console.log(`Total: ${migrations.length} migration(s)`);
  console.log("");
  console.log("ORDEM DE APLICAÇÃO (não alterar sequência):");
  console.log("-".repeat(60));

  for (const migration of migrations) {
    console.log("");
    console.log(`[${migration.order}] ${migration.filename}`);
    console.log(`    Tabelas/objetos: ${migration.tables.join(", ") || "(helpers only)"}`);
    console.log(
      `    RLS: ${migration.rlsEnabled === null ? "n/a" : migration.rlsEnabled ? "habilitado" : "não detectado"}`,
    );
    if (migration.notes.length) {
      console.log("    Notas:");
      for (const note of migration.notes) {
        console.log(`      - ${note}`);
      }
    }
  }

  console.log("");
  console.log("-".repeat(60));
  console.log("Este script NÃO executa supabase db push, link ou reset.");
  console.log("Guia operacional: docs/operations/apply-supabase-migrations.md");
  console.log("Checklist: docs/operations/supabase-migration-checklist.md");
  console.log("");
}

printPlan();
