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
  | "staging_target_manifest_present"
  | "staging_env_templates_present"
  | "staging_env_local_ignored"
  | "staging_bootstrap_plan_script"
  | "staging_manifest_no_secrets"
  | "staging_bootstrap_docs_pack"
  | "staging_bootstrap_pack_tests"
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
  | "agent_runtime_docs_present"
  | "mission_persistence_migration_present"
  | "mission_persistence_rls_enabled"
  | "mission_persistence_anon_denied"
  | "mission_persistence_supabase_adapter_present"
  | "mission_persistence_fallback_present"
  | "mission_recovery_policy_present"
  | "mission_persistence_tests_passing"
  | "mission_persistence_docs_present"
  | "mission_persistence_events_typed"
  | "agent_execution_history_repository_present"
  | "agent_execution_metrics_calculator_present"
  | "agent_execution_pagination_present"
  | "agent_execution_retention_policy_present"
  | "agents_page_history_integrated"
  | "agent_execution_history_tests_passing"
  | "agent_execution_history_docs_present"
  | "agent_history_events_typed"
  | "release_readiness_agent_registered"
  | "release_readiness_mission_present"
  | "release_readiness_agent_capabilities_safe"
  | "release_readiness_production_approval_absent"
  | "release_readiness_mission_agent_integration"
  | "release_readiness_agent_tests_passing"
  | "release_readiness_agent_docs_present"
  | "mission_type_catalog_aligned"
  | "mission_type_catalog_tests_passing"
  | "mission_persistence_runtime_validator_present"
  | "mission_persistence_remote_report_present"
  | "mission_persistence_test_data_policy_present"
  | "staging_requires_supabase_required_persistence"
  | "mission_persistence_no_service_role_frontend"
  | "mission_persistence_remote_readiness_tests_passing"
  | "mission_persistence_remote_readiness_docs_present"
  | "mission_persistence_remote_validation_widget_present"
  | "staging_persistence_acceptance_suite_present"
  | "staging_persistence_acceptance_scenarios_present"
  | "staging_persistence_reload_handshake_present"
  | "staging_persistence_recovery_validation_present"
  | "staging_persistence_multi_agent_isolation_present"
  | "staging_acceptance_check_script_present"
  | "staging_persistence_safety_gate_checks_present"
  | "staging_persistence_acceptance_tests_passing"
  | "staging_persistence_acceptance_docs_present"
  | "staging_persistence_acceptance_widget_present";

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
  staging_target_manifest_present: "StagingTargetManifest presente",
  staging_env_templates_present: "Templates de env staging seguros",
  staging_env_local_ignored: "Arquivos .env locais ignorados",
  staging_bootstrap_plan_script: "Script staging:bootstrap-plan disponível",
  staging_manifest_no_secrets: "Manifest staging sem secrets",
  staging_bootstrap_docs_pack: "Docs staging bootstrap pack presentes",
  staging_bootstrap_pack_tests: "Testes staging bootstrap pack passando",
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
  mission_persistence_migration_present: "Migration mission_executions presente",
  mission_persistence_rls_enabled: "RLS mission persistence habilitado",
  mission_persistence_anon_denied: "Anon sem acesso mission_executions",
  mission_persistence_supabase_adapter_present: "Adapter Supabase mission persistence",
  mission_persistence_fallback_present: "Fallback session mission persistence",
  mission_recovery_policy_present: "Recovery policy mission execution",
  mission_persistence_tests_passing: "Testes mission persistence passando",
  mission_persistence_docs_present: "Docs mission persistence presentes",
  mission_persistence_events_typed: "Eventos mission:persistence_* tipados",
  agent_execution_history_repository_present: "Repository histórico de agentes presente",
  agent_execution_metrics_calculator_present: "Metrics calculator de agentes presente",
  agent_execution_pagination_present: "Paginação histórico de agentes presente",
  agent_execution_retention_policy_present: "Retention policy histórico de agentes",
  agents_page_history_integrated: "Agents page com histórico integrado",
  agent_execution_history_tests_passing: "Testes agent execution history",
  agent_execution_history_docs_present: "Docs agent execution history presentes",
  agent_history_events_typed: "Eventos agent:history_* tipados",
  release_readiness_agent_registered: "Release Readiness Agent registrado",
  release_readiness_mission_present: "Missão release_readiness_review presente",
  release_readiness_agent_capabilities_safe: "Capabilities Release Readiness Agent seguras",
  release_readiness_production_approval_absent: "Agente sem aprovação de produção",
  release_readiness_mission_agent_integration: "Integração Mission → Release Agent",
  release_readiness_agent_tests_passing: "Testes Release Readiness Agent",
  release_readiness_agent_docs_present: "Docs Release Readiness Agent presentes",
  mission_type_catalog_aligned: "Catálogo mission types alinhado (app, SQL, executor, policy)",
  mission_type_catalog_tests_passing: "Testes mission type catalog drift passando",
  mission_persistence_runtime_validator_present: "Runtime validator mission persistence presente",
  mission_persistence_remote_report_present: "Remote report mission persistence presente",
  mission_persistence_test_data_policy_present: "Test data policy mission persistence presente",
  staging_requires_supabase_required_persistence: "Staging exige supabase_required",
  mission_persistence_no_service_role_frontend: "Sem service_role no frontend de persistência",
  mission_persistence_remote_readiness_tests_passing: "Testes remote mission persistence readiness",
  mission_persistence_remote_readiness_docs_present: "Docs remote mission persistence presentes",
  mission_persistence_remote_validation_widget_present: "Widget validação remota presente",
  staging_persistence_acceptance_suite_present: "Acceptance suite presente",
  staging_persistence_acceptance_scenarios_present: "Cinco cenários acceptance presentes",
  staging_persistence_reload_handshake_present: "Reload handshake presente",
  staging_persistence_recovery_validation_present: "Recovery validation presente",
  staging_persistence_multi_agent_isolation_present: "Multi-agent isolation presente",
  staging_acceptance_check_script_present: "Script staging:acceptance:check presente",
  staging_persistence_safety_gate_checks_present: "Safety gate checks acceptance presentes",
  staging_persistence_acceptance_tests_passing: "Testes acceptance passando",
  staging_persistence_acceptance_docs_present: "Docs acceptance presentes",
  staging_persistence_acceptance_widget_present: "Widget acceptance presente",
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
  "20250710210000_mission_executions.sql",
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
  "docs/architecture/mission-persistence.md",
  "docs/database/mission-execution-schema.md",
  "docs/operations/mission-persistence-runbook.md",
  "docs/agents/agent-execution-history.md",
  "docs/architecture/agent-metrics.md",
  "docs/operations/agent-history-runbook.md",
  "docs/agents/release-readiness-agent.md",
  "docs/architecture/multi-agent-assignment.md",
  "docs/operations/release-readiness-agent-runbook.md",
  "supabase/functions/audit-ingest/README.md",
] as const;

export const REQUIRED_RELEASE_WORKFLOWS = [
  ".github/workflows/validate.yml",
  ".github/workflows/release-readiness.yml",
] as const;
