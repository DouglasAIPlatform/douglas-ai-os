# Mission Persistence Architecture

Sprint 5.50 introduz persistência durável das execuções de missão no Supabase, com fallback em `sessionStorage` e reidratação no Headquarters.

## Fluxo

```
MissionExecutionCoordinator
  → CompositeMissionExecutionPersistence
      → SupabaseMissionExecutionPersistence (preferido)
      → SessionMissionExecutionPersistence (fallback)
  → mission_executions / mission_execution_events (RLS)
  → reidratação no HQ (sem reiniciar agente)
```

## Modos

| Modo | Comportamento |
|------|----------------|
| `session_only` | Apenas sessionStorage |
| `supabase_preferred` | Supabase quando disponível; fallback local em falha |
| `supabase_required` | Exige Supabase (staging após bootstrap) |

Development usa `supabase_preferred` por padrão no Headquarters.

## Componentes

- **SupabaseMissionExecutionPersistence** — CRUD sanitizado via client autenticado (sem `service_role` no frontend)
- **CompositeMissionExecutionPersistence** — dual-write, fila pendente limitada (50), retry manual
- **MissionExecutionRecoveryPolicy** — running/assigned após reload → `interrupted` ou `recovery_required`
- **rehydrateMissionExecutions** — carrega execuções recentes + timeline; não executa agente

## Eventos

- `mission:persistence_saved`
- `mission:persistence_failed`
- `mission:persistence_fallback`
- `mission:persistence_rehydrated`
- `mission:recovery_required`
- `mission:persistence_validation_started` / `_passed` / `_failed` (Sprint 5.54)
- `mission:persistence_remote_confirmed` (Sprint 5.54)
- `mission:persistence_acceptance_started` / `_passed` / `_failed` (Sprint 5.55)

## Validação remota (Sprint 5.54)

Após migration manual no staging, use `MissionPersistenceRuntimeValidator` via widget HQ — ver [remote-mission-persistence-validation](../operations/remote-mission-persistence-validation.md).

## Acceptance reidratação (Sprint 5.55)

`StagingPersistenceAcceptanceSuite` prova o ciclo execute → persist → reload → rehydrate → metrics — ver [staging-persistence-acceptance](../operations/staging-persistence-acceptance.md) e [persistence-rehydration-lifecycle](./persistence-rehydration-lifecycle.md).

Eventos de persistência não geram audit lifecycle (flag `audited: true` no payload).

## Segurança

- Sem tokens, e-mail, payload completo ou stack trace
- RLS via `require_active_operator()`, `operator_has_permission('platform:view')` e helpers dedicados
- `created_by_user_id` deve ser `auth.uid()` — role nunca vem do browser

## Mission types persistíveis (Patch 5.52.1)

Catálogo canônico em `@douglas/missions` — `PERSISTABLE_MISSION_TYPES`:

| Mission type | Executor | Agente |
|--------------|----------|--------|
| `operational_diagnostic` | `DiagnosticMissionExecutor` | `system-diagnostics-agent` |
| `release_readiness_review` | `ReleaseReadinessMissionExecutor` | `release-readiness-agent` |

Camadas que devem permanecer alinhadas:

1. **`PERSISTABLE_MISSION_TYPES`** — fonte canônica TypeScript
2. **`MissionExecutionAccessPolicy`** — RBAC de execução (operator)
3. **`createDefaultMissionExecutorRegistry`** — um executor por type
4. **`is_operational_mission_type()`** — SQL/RLS na migration
5. **`useMissionExecution` / `MISSION_CONFIG`** — seletor Headquarters

### Drift check

`runMissionTypeCatalogDriftCheck(repoRoot)` compara snapshots read-only e falha quando:

- um type existe na app e não no SQL;
- um type existe no SQL sem executor ou policy;
- o SQL aceita types desconhecidos ou retorno genérico.

Integrado em `pnpm release:check` como `mission_type_catalog_aligned`.

Testes: `packages/missions/src/execution/catalog/mission-type-catalog-drift.test.ts`

## Referências

- [Schema](../database/mission-execution-schema.md)
- [Runbook](../operations/mission-persistence-runbook.md)
- [Mission execution lifecycle](./mission-execution-lifecycle.md)
