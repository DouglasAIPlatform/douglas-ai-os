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
  | "versioned_secrets_scan"
  | "rbac_verification_tests"
  | "dos_environment_documented"
  | "dos_environment_policies_present"
  | "dos_environment_production_no_mocks"
  | "release_manifest_present"
  | "release_semver_valid"
  | "release_version_consistency"
  | "changelog_present"
  | "changelog_current_version_entry"
  | "release_workflows_present"
  | "release_environment_profile_compatible"
  | "environment_canonical_resolver_present"
  | "environment_adapters_present"
  | "environment_no_unsafe_production_default"
  | "environment_resolution_docs_present"
  | "server_rbac_migration_present"
  | "server_rbac_helpers_present"
  | "server_rbac_no_permissive_anon"
  | "server_rbac_tests_passing"
  | "owner_admin_separation_verified"
  | "inactive_profile_guard_present"
  | "owner_admin_handoff_tests_passing"
  | "owner_permission_seed_migration_present"
  | "owner_permission_seed_complete"
  | "owner_permission_seed_owner_only"
  | "owner_permission_seed_no_anon"
  | "owner_admin_rls_separated"
  | "admin_cannot_promote_owner"
  | "inactive_profile_rls_blocked"
  | "no_permissive_rbac_policies"
  | "rbac_catalog_drift_check"
  | "staging_profile_present"
  | "staging_no_mocks_allowed"
  | "staging_requires_real_auth"
  | "staging_requires_edge_audit"
  | "staging_bootstrap_docs_present"
  | "staging_check_script_available"
  | "mission_execution_coordinator_present"
  | "mission_idempotency_guard_present"
  | "mission_events_typed"
  | "mission_execution_widget_integrated"
  | "mission_execution_tests_passing"
  | "mission_no_external_ai_dependency"
  | "mission_execution_docs_present"
  | "system_diagnostics_agent_registered"
  | "agent_manifest_safe_capabilities"
  | "mission_agent_integration_present"
  | "agent_events_typed"
  | "operational_agent_tests_passing"
  | "agent_runtime_docs_present";

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
  rbac_verification_tests: "Suíte RBAC (pnpm test:rbac)",
  dos_environment_documented: "NEXT_PUBLIC_DOS_ENVIRONMENT documentado",
  dos_environment_policies_present: "Políticas de ambiente presentes",
  dos_environment_production_no_mocks: "Production sem mocks na política",
  release_manifest_present: "Manifesto de release presente",
  release_semver_valid: "Versão SemVer válida no manifest",
  release_version_consistency: "Versões consistentes entre fontes",
  changelog_present: "CHANGELOG.md presente",
  changelog_current_version_entry: "Entrada da versão atual no CHANGELOG",
  release_workflows_present: "Workflows de release/validate presentes",
  release_environment_profile_compatible: "Perfil de ambiente compatível com release",
  environment_canonical_resolver_present: "Resolver canônico de ambiente presente",
  environment_adapters_present: "Adapters de compatibilidade presentes",
  environment_no_unsafe_production_default: "Production nunca é default",
  environment_resolution_docs_present: "Documentação de resolução de ambiente",
  server_rbac_migration_present: "Migration RBAC server-side presente",
  server_rbac_helpers_present: "Helpers SQL RBAC essenciais",
  server_rbac_no_permissive_anon: "Sem policy permissiva para anon",
  server_rbac_tests_passing: "Testes server RBAC passando",
  owner_admin_separation_verified: "Owner diferente de admin no catálogo",
  inactive_profile_guard_present: "Inactive profile guard presente",
  owner_admin_handoff_tests_passing: "Testes owner/admin e profile inativo",
  owner_permission_seed_migration_present: "Migration owner permission seed presente",
  owner_permission_seed_complete: "Seed owner-exclusive completo (4 permissões)",
  owner_permission_seed_owner_only: "Owner-exclusive somente para role owner",
  owner_permission_seed_no_anon: "Owner seed sem grant para anon",
  owner_admin_rls_separated: "RLS owner/admin separado",
  admin_cannot_promote_owner: "Admin não promove owner",
  inactive_profile_rls_blocked: "Profile inativo bloqueado em RLS",
  no_permissive_rbac_policies: "Sem policies RBAC permissivas",
  rbac_catalog_drift_check: "Catálogo RBAC alinhado (drift check)",
  staging_profile_present: "Perfil staging presente",
  staging_no_mocks_allowed: "Staging não permite mocks",
  staging_requires_real_auth: "Staging exige auth real",
  staging_requires_edge_audit: "Staging exige audit Edge Function",
  staging_bootstrap_docs_present: "Docs staging bootstrap presentes",
  staging_check_script_available: "Script staging:check disponível",
  mission_execution_coordinator_present: "MissionExecutionCoordinator presente",
  mission_idempotency_guard_present: "Idempotency guard de missões presente",
  mission_events_typed: "Eventos mission:* tipados",
  mission_execution_widget_integrated: "MissionExecutionWidget no HQ",
  mission_execution_tests_passing: "Testes de execução de missão",
  mission_no_external_ai_dependency: "Sem IA externa obrigatória",
  mission_execution_docs_present: "Docs mission execution presentes",
  system_diagnostics_agent_registered: "System Diagnostics Agent registrado",
  agent_manifest_safe_capabilities: "Capabilities do agente seguras (read-only)",
  mission_agent_integration_present: "Integração Mission → Agent presente",
  agent_events_typed: "Eventos agent:* tipados",
  operational_agent_tests_passing: "Testes operational agent runtime",
  agent_runtime_docs_present: "Docs operational agent runtime presentes",
};

/** Migrations mínimas esperadas para release (ordem lexicográfica). */
export const EXPECTED_SUPABASE_MIGRATIONS = [
  "20250707130000_platform_helpers.sql",
  "20250707130001_operator_profiles.sql",
  "20250707130002_operational_audit_entries.sql",
  "20250707130003_operator_sessions.sql",
  "20250710180000_server_rbac_enforcement.sql",
  "20250710190000_owner_permission_seed.sql",
  "20250710200000_owner_admin_rls_separation.sql",
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
  "docs/security/rbac-verification-suite.md",
  "docs/security/server-side-rbac-enforcement.md",
  "docs/security/owner-admin-separation.md",
  "docs/security/inactive-profile-guard.md",
  "docs/security/rbac-catalog-drift-guard.md",
  "docs/database/rbac-rls-policies.md",
  "docs/database/owner-permission-seed.md",
  "docs/architecture/environment-separation.md",
  "docs/architecture/environment-resolution.md",
  "docs/operations/staging-production-environments.md",
  "docs/operations/staging-bootstrap.md",
  "docs/operations/staging-validation-checklist.md",
  "docs/engineering/release-versioning.md",
  "docs/operations/release-process.md",
  "docs/architecture/mission-execution-lifecycle.md",
  "docs/operations/mission-execution-runbook.md",
  "docs/agents/system-diagnostics-agent.md",
  "docs/architecture/operational-agent-runtime.md",
  "docs/operations/agent-execution-runbook.md",
  "supabase/functions/audit-ingest/README.md",
] as const;

export const REQUIRED_RELEASE_WORKFLOWS = [
  ".github/workflows/validate.yml",
  ".github/workflows/release-readiness.yml",
] as const;
