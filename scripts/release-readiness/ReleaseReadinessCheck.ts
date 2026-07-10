export type ReleaseReadinessCheckOutcome = "pass" | "warn" | "fail" | "skip";

export type ReleaseReadinessCheckId =
  | "validate_pipeline"
  | "supabase_migrations_present"
  | "audit_ingest_function_present"
  | "env_example_present"
  | "env_local_not_tracked"
  | "supabase_temp_not_tracked"
  | "audit_write_mode_edge_function"
  | "operational_docs_present"
  | "versioned_secrets_scan";

export interface ReleaseReadinessCheck {
  id: ReleaseReadinessCheckId;
  label: string;
  outcome: ReleaseReadinessCheckOutcome;
  message: string;
  /** Quando true e outcome === fail, status final vira failed. */
  blocking: boolean;
  docPath?: string;
}

export const RELEASE_READINESS_CHECK_LABELS: Record<ReleaseReadinessCheckId, string> = {
  validate_pipeline: "Pipeline validate (typecheck, lint, build)",
  supabase_migrations_present: "Migrations Supabase presentes",
  audit_ingest_function_present: "Edge Function audit-ingest presente",
  env_example_present: "Arquivo .env.example presente",
  env_local_not_tracked: ".env.local não rastreado pelo Git",
  supabase_temp_not_tracked: "supabase/.temp não rastreado pelo Git",
  audit_write_mode_edge_function: "Audit writeMode = edge_function",
  operational_docs_present: "Documentação operacional obrigatória",
  versioned_secrets_scan: "Scan de secrets versionados",
};

/** Migrations mínimas esperadas para release (ordem lexicográfica). */
export const EXPECTED_SUPABASE_MIGRATIONS = [
  "20250707130000_platform_helpers.sql",
  "20250707130001_operator_profiles.sql",
  "20250707130002_operational_audit_entries.sql",
  "20250707130003_operator_sessions.sql",
] as const;

/** Documentos operacionais e de arquitetura exigidos antes de release. */
export const REQUIRED_RELEASE_DOCS = [
  "docs/engineering/validation-pipeline.md",
  "docs/engineering/release-readiness-pipeline.md",
  "docs/operations/production-safety-gate.md",
  "docs/operations/apply-supabase-migrations.md",
  "docs/operations/supabase-migration-checklist.md",
  "docs/operations/release-checklist.md",
  "docs/architecture/audit-edge-function.md",
  "docs/architecture/audit-migration-supabase.md",
  "supabase/functions/audit-ingest/README.md",
] as const;
