# RBAC RLS Policies — Douglas AI Platform

> Sprint: 5.42  
> Banco: Supabase Postgres

## Tabelas cobertas

| Tabela | RLS | Escrita client |
|--------|-----|----------------|
| `operator_profiles` | ✓ | INSERT/UPDATE admin; UPDATE own limitado |
| `operator_role_permissions` | ✓ | Somente migrations/service |
| `operational_audit_entries` | ✓ | **Negado** — Edge Function only |

## operator_profiles (Sprint 5.45 — owner/admin separados)

| Policy | Quem | Regra |
|--------|------|-------|
| `operator_profiles_select_own` | authenticated | `user_id = auth.uid()` |
| `operator_profiles_select_owner_managed` | owner | `can_manage_operational_roles()` + `platform:view` + profile **active** |
| `operator_profiles_select_admin_managed` | admin | `is_active_admin_operator()` — só rows `operator`/`viewer` |
| `operator_profiles_update_own_limited` | own | status **active**; role/status imutáveis |
| `operator_profiles_update_owner` | owner | `can_manage_operational_roles()`; role `owner` exige `can_promote_to_owner()` |
| `operator_profiles_update_admin` | admin | só targets `operator`/`viewer`; não promove owner |
| `operator_profiles_insert_owner` | owner | role `owner` → `can_promote_to_owner()`; demais → `can_manage_operational_roles()` |
| `operator_profiles_insert_admin` | admin | só `operator`/`viewer` |
| `operator_profiles_delete_owner` | owner | delete owner row → `can_promote_to_owner()`; demais → `can_manage_operational_roles()` |

**Profile inativo (`invited`/`suspended`):** `require_active_operator()` false — sem mutações administrativas.

### Helpers owner/admin (5.45)

| Função | Uso |
|--------|-----|
| `can_promote_to_owner()` | `security:manage_owners` + profile active |
| `can_manage_operational_roles()` | `security:manage_roles` + profile active |
| `is_active_admin_operator()` | admin + active + `platform:view` |
| `can_read_full_audit_log()` | owner/admin + active + `platform:view` (leitura audit — não owner-exclusive) |

## operator_role_permissions

- SELECT authenticated (catálogo read-only)
- **Deny ALL anon** (policy explícita Sprint 5.42)
- Seed base: `20250707130000_platform_helpers.sql` (6 permissões compartilhadas)
- Seed owner-exclusive: `20250710190000_owner_permission_seed.sql` (Sprint 5.44)

## operational_audit_entries

| Policy | Efeito |
|--------|--------|
| `audit_entries_select_*` | Requer `require_active_operator()` + `platform:view` |
| `audit_entries_insert_denied_authenticated` | `WITH CHECK (false)` |
| `audit_entries_insert_denied_anon` | `WITH CHECK (false)` |
| `audit_entries_update_denied` | append-only |
| `audit_entries_delete_denied` | append-only |

Ingest via **service_role** na Edge Function — bypass RLS controlado server-side.

## Helpers SQL

```sql
-- Exemplos (requer JWT authenticated)
SELECT public.current_operator_profile();
SELECT public.current_operator_role();
SELECT public.operator_has_permission('runtime:pause');
SELECT public.require_active_operator();
```

Todos usam `auth.uid()` — retornam NULL/false para anon.

## Matriz role → permissão (servidor)

| Role | Permissões |
|------|------------|
| viewer | platform:view |
| operator | + runtime:refresh, runtime:health_check |
| admin | + runtime:pause, runtime:resume, runtime:restart |
| owner | admin + security:manage_roles, security:manage_owners, release:approve_production, platform:critical_configuration |

Ver [owner-permission-seed.md](./owner-permission-seed.md) para detalhes do seed owner-exclusive.

## Apply manual

```bash
# Local (quando Supabase CLI configurado)
supabase db reset   # dev only
# ou apply incremental conforme runbook
```

Ver [apply-supabase-migrations.md](../operations/apply-supabase-migrations.md).

**Não** aplicar em produção sem revisão de RLS e backup.

## Migrations

| Arquivo | Escopo |
|---------|--------|
| `20250710180000_server_rbac_enforcement.sql` | Helpers SQL + RLS endurecido |
| `20250710190000_owner_permission_seed.sql` | Seed owner-exclusive (4 permissões) |
| `20250710200000_owner_admin_rls_separation.sql` | RLS owner ≠ admin em operator_profiles |

Depende de:

- `20250707130000_platform_helpers.sql`
- `20250707130001_operator_profiles.sql`
- `20250707130002_operational_audit_entries.sql`
