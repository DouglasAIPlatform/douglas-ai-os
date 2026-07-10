# RBAC RLS Policies — Douglas AI Platform

> Sprint: 5.42  
> Banco: Supabase Postgres

## Tabelas cobertas

| Tabela | RLS | Escrita client |
|--------|-----|----------------|
| `operator_profiles` | ✓ | INSERT/UPDATE admin; UPDATE own limitado |
| `operator_role_permissions` | ✓ | Somente migrations/service |
| `operational_audit_entries` | ✓ | **Negado** — Edge Function only |

## operator_profiles

| Policy | Role | Regra |
|--------|------|-------|
| `operator_profiles_select_own` | authenticated | `user_id = auth.uid()` |
| `operator_profiles_select_admin` | authenticated | profile ativo + `platform:view` + owner/admin |
| `operator_profiles_update_own_limited` | authenticated | own + **status active**; role imutável |
| `operator_profiles_update_admin` | authenticated | owner/admin |
| `operator_profiles_insert_admin` | authenticated | owner/admin |
| `operator_profiles_delete_owner` | authenticated | owner |

**Profile inativo:** sem autorização operacional; leitura própria permitida para UI de onboarding.

## operator_role_permissions

- SELECT authenticated (catálogo read-only)
- **Deny ALL anon** (policy explícita Sprint 5.42)
- Seed alinhado a `ROLE_PERMISSIONS` (@douglas/security)

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
| admin/owner | + runtime:pause, runtime:resume, runtime:restart |

## Apply manual

```bash
# Local (quando Supabase CLI configurado)
supabase db reset   # dev only
# ou apply incremental conforme runbook
```

Ver [apply-supabase-migrations.md](../operations/apply-supabase-migrations.md).

**Não** aplicar em produção sem revisão de RLS e backup.

## Migration

`supabase/migrations/20250710180000_server_rbac_enforcement.sql`

Depende de:

- `20250707130000_platform_helpers.sql`
- `20250707130001_operator_profiles.sql`
- `20250707130002_operational_audit_entries.sql`
