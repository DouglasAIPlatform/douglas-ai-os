# Supabase Staging Validation — Douglas AI Platform

> Status: Operations v1.0  
> Sprint: 5.28  
> Escopo: console read-only em `/headquarters` — **não aplica migrations nem deploy**.

## Objetivo

Dar ao CEO/operador uma visão clara se o ambiente Supabase está pronto para staging, sem operações destrutivas ou exposição de dados sensíveis.

## Onde usar

**Headquarters → Supabase Staging Validation** (`SupabaseValidationWidget`)

- Executa automaticamente no mount
- Botão **Reexecutar validação (read-only)** força nova rodada
- Complementa (não substitui) `SupabaseConnectionWidget`, `AuthStatusWidget` e `AuditTrailWidget`

## O que o console faz

| Ação | Permitido? |
|------|------------|
| `SELECT … LIMIT 1` em tabelas | Sim (probe) |
| `auth.getSession()` | Sim |
| Health check Auth API | Sim |
| INSERT / UPDATE / DELETE | **Não** |
| Aplicar migrations | **Não** |
| Deploy Edge Function | **Não** |
| Usar service_role no browser | **Não** |

Nenhum dado de linha (email, profile, audit entry) é renderizado — apenas status agregado.

## Status geral (`SupabaseReadinessStatus`)

| Status | Significado | Interpretação |
|--------|-------------|---------------|
| `not_configured` | Sem `NEXT_PUBLIC_SUPABASE_*` | Dev local OK — siga com mock |
| `ready_for_migration` | Projeto acessível, tabelas faltando | Aplique migrations antes de auth/audit remoto |
| `partially_configured` | Mix de OK + alertas | Revise checks amarelos e docs |
| `ready_for_auth` | Tabelas core detectadas + conexão OK | Login, profiles e validação operacional |
| `error` | Falha conexão ou auth layer | Corrija env vars / projeto Supabase |

## Checks executados

| ID | Fonte | Read-only |
|----|-------|-----------|
| `basic_connection` | Health check | Sim |
| `auth_available` | `auth.getSession()` | Sim |
| `operator_profiles_table` | Probe `operator_profiles` | Sim |
| `operational_audit_entries_table` | Probe `operational_audit_entries` | Sim |
| `connection_widget_status` | Estado `SupabaseProvider` | Sim |
| `auth_session_status` | `AuthSessionProvider` snapshot | Sim |
| `audit_persistence_status` | `AuditPersistenceAdapter` status | Sim |
| `edge_function_prepared` | Config monorepo + writeMode | Sim (sem invoke destrutivo) |

## Quando aplicar migrations

Aplique quando:

- Status **`ready_for_migration`**
- Checks de tabela com alerta "migration pendente"
- Checklist em `docs/operations/supabase-migration-checklist.md` revisado

Procedimento: `docs/operations/apply-supabase-migrations.md` (manual — CLI ou Dashboard).

**Não** use o widget para aplicar migrations — ele apenas indica readiness.

## Quando habilitar Edge Function

1. Migrations 5.20 aplicadas (`operational_audit_entries` existe)
2. `supabase functions deploy audit-ingest` (manual)
3. Teste invoke + INSERT visível no Dashboard
4. Alterar `auditSupabaseConfig.writeMode` para `"edge_function"` em staging
5. Validar `AuditTrailWidget` — status remoto `accepted`

Até lá, mantenha `direct_client` + fallback localStorage (comportamento padrão).

Documentação: `docs/architecture/audit-edge-function.md`

## Quando começar RBAC real

Pré-requisitos:

1. Status **`ready_for_auth`**
2. Migrations incluindo `operator_profiles`
3. Usuário criado via Supabase Auth
4. Row owner em `operator_profiles` (SQL service_role / Dashboard — **não** no frontend)
5. Login + handoff auth → operator (`docs/architecture/auth-operator-handoff.md`)

RBAC efetivo ainda depende de RLS Postgres — o client apenas reflete profile quando existir.

## Arquivos

| Path | Papel |
|------|-------|
| `packages/supabase/src/staging-validation/*` | Engine read-only + report |
| `apps/headquarters/features/platform-supabase/staging-validation/` | Hook HQ |
| `apps/headquarters/components/widgets/SupabaseValidationWidget.tsx` | UI |

## Referências

- [apply-supabase-migrations.md](./apply-supabase-migrations.md)
- [supabase-migration-checklist.md](./supabase-migration-checklist.md)
- [../architecture/auth-operator-handoff.md](../architecture/auth-operator-handoff.md)
- [../architecture/audit-edge-function.md](../architecture/audit-edge-function.md)
