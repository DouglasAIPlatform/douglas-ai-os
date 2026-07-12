# Mission Execution Schema

Migration: `supabase/migrations/20250710210000_mission_executions.sql`

**Não aplicar automaticamente em remoto** — seguir [apply-supabase-migrations](../operations/apply-supabase-migrations.md).

## Tabelas

### `mission_executions`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `execution_id` | text PK | ID estável da aplicação |
| `mission_id` | text | Missão no board |
| `mission_type` | text | ex.: `operational_diagnostic`, `release_readiness_review` |
| `attempt` | int ≥ 1 | Tentativa (retry incrementa) |
| `status` | text | Lifecycle + `interrupted`, `recovery_required` |
| `board_status` | text | Status mapeado do board |
| `progress` | int 0–100 | |
| `assigned_agent_id` | text | |
| `created_by` | text | Actor sanitizado |
| `created_by_user_id` | uuid FK auth.users | RLS |
| `operator_profile_id` | uuid FK operator_profiles | Opcional |
| `correlation_id`, `request_id` | text | Rastreio |
| `result_summary` | text | Sanitizado |
| `sanitized_error_code`, `sanitized_error_message` | text | |
| `started_at`, `completed_at`, `created_at`, `updated_at` | timestamptz | |

### `mission_execution_events`

| Coluna | Tipo | Notas |
|--------|------|-------|
| `execution_id` | text FK | |
| `sequence` | int ≥ 1 | UNIQUE (execution_id, sequence) |
| `event_type` | text | ex.: `status:running` |
| `status`, `progress`, `step`, `summary` | | Timeline sanitizada |
| `recorded_at` | timestamptz | |

## Constraints

- `execution_id` único (PK)
- Eventos não duplicados (`UNIQUE execution_id + sequence`)
- Trigger `guard_mission_execution_terminal_overwrite` — resultados terminais imutáveis
- Índices: `mission_id`, `assigned_agent_id`, `status`, `created_at`

## RLS

Helpers:

- `is_operational_mission_type(mission_type)` — lista explícita alinhada a `PERSISTABLE_MISSION_TYPES`
- `can_read_mission_execution_row(mission_type, created_by_user_id)`
- `can_write_mission_execution_row(mission_type, created_by_user_id)`

### Mission types persistíveis

| Mission type | SQL | App RBAC | Executor |
|--------------|-----|----------|----------|
| `operational_diagnostic` | ✓ | operator execute | `DiagnosticMissionExecutor` |
| `release_readiness_review` | ✓ | operator execute | `ReleaseReadinessMissionExecutor` |

Types desconhecidos são rejeitados — `is_operational_mission_type` usa `IN (...)` explícito, sem retorno genérico `true`.

Drift guard: `pnpm release:check` → check `mission_type_catalog_aligned`.

### Regras por role

| Role | Leitura | Escrita |
|------|---------|---------|
| anon | negado | negado |
| inativo | negado (via `require_active_operator`) | negado |
| viewer | permitido (platform:view) | negado |
| operator | próprias + operational types | operational types próprias |
| admin/owner | ampliado | ampliado |

Sem policies `USING (true)` ou `WITH CHECK (true)`.

## O que NÃO persistir

Tokens, chaves, e-mail, payload completo, stack trace, secrets, URL Supabase completa.
