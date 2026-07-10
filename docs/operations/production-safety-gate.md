# Production Safety Gate — Douglas AI Platform

> Status: Operations v1.0  
> Sprint: 5.34  
> Escopo: diagnóstico read-only em `/headquarters` — **não aplica migrations, não faz deploy, não substitui revisão humana**.

## Objetivo

Informar se o ambiente está seguro o bastante para avançar de **local/staging** para **produção**, consolidando sinais de Supabase, auth/RBAC, audit remoto e fila local de pendências.

Complementa (não substitui):

- `SupabaseValidationWidget` (readiness staging)
- `AuthStatusWidget` (handoff auth → operator)
- `AuditTrailWidget` (persistência e fila)

## Onde usar

**Headquarters → Production Safety Gate** (`ProductionSafetyWidget`)

- Avalia automaticamente no mount
- Botão **Reexecutar gate (read-only)** força nova rodada
- Nenhum email, UID, token, URL completa ou key é exibido

## Aviso importante

Este gate é **diagnóstico**. Mesmo com status `ready_for_production_review`, é obrigatória revisão humana de:

- migrations e RLS
- secrets e env vars (incl. Edge Function)
- CORS e JWT (`AUDIT_INGEST_*`)
- runbooks e checklist operacional

## Status geral (`ProductionSafetyStatus`)

| Status | Significado |
|--------|-------------|
| `not_ready` | Fundamentos ausentes — Supabase, tabelas ou auth API |
| `ready_for_staging` | Base OK para staging; alertas restantes antes de produção |
| `ready_for_production_review` | Todos os checks passaram — aguarda revisão humana |
| `blocked` | Risco crítico (checks bloqueantes) — corrija antes de continuar |

## Checks executados

| ID | O que verifica | Read-only |
|----|----------------|-----------|
| `supabase_configured` | Env vars + health check | Sim |
| `core_tables_detected` | `operator_profiles` + `operational_audit_entries` | Sim (probe SELECT) |
| `auth_api_available` | `auth.getSession()` | Sim |
| `user_authenticated` | Sessão ativa | Sim (snapshot) |
| `operator_profile_found` | Row em `operator_profiles` | Sim |
| `effective_role_not_mock` | RBAC não deriva de mock | Sim |
| `active_owner_present` | Profile `owner` + `status=active` | Sim |
| `audit_write_mode_edge_function` | `writeMode === edge_function` | Sim (config) |
| `audit_remote_status_accepted` | Último ingest remoto `accepted` | Sim (status adapter) |
| `audit_fallback_healthy` | Fallback local sem erro crítico | Sim |
| `pending_queue_within_limit` | Fila local ≤ limite | Sim |
| `edge_function_deployed` | Função indicada / não 404 | Sim |
| `production_mock_role_locked` | Produção bloqueia troca mock role | Sim |

### Limite da fila de pendências

`PRODUCTION_SAFETY_PENDING_QUEUE_LIMIT = 25` (package `@douglas/supabase`).

Acima disso → check `pending_queue_within_limit` falha.

## O que precisa estar verde antes de produção

Para `ready_for_production_review`:

1. Supabase configurado e health check OK
2. Tabelas principais detectadas
3. Auth API + usuário autenticado
4. `operator_profiles` com owner ativo
5. RBAC via profile (não mock)
6. Audit em `edge_function` com último status remoto `accepted`
7. Fallback local estável (sem erros críticos)
8. Fila de pendências abaixo do limite
9. Edge Function deployada (sem flag `edgeFunctionNotDeployed`)
10. Em `VERCEL_ENV=production`: `mockRoleChangeAllowed === false`

## Ambiente sem Supabase

Sem `NEXT_PUBLIC_SUPABASE_*`:

- Checks dependentes ficam `skip`
- Status típico: `not_ready` (caminho local/mock)
- **Não quebra** dev local — audit continua em localStorage

## O que o gate **não** faz

| Ação | Permitido? |
|------|------------|
| Aplicar migrations | **Não** |
| Deploy Edge Function | **Não** |
| INSERT/UPDATE/DELETE | **Não** |
| Usar `service_role` no browser | **Não** |
| Substituir checklist humano | **Não** |

`service_role` permanece **somente** no runtime da Edge Function (`audit-ingest`).

## Como testar em staging

1. Configure env vars Supabase em `.env.local` ou Vercel Preview
2. Aplique migrations (manual — ver `docs/operations/apply-supabase-migrations.md`)
3. Login em `/login` + owner em `operator_profiles`
4. Deploy manual `audit-ingest` + `writeMode: edge_function`
5. Gere evento de audit e confirme status remoto `accepted` no `AuditTrailWidget`
6. Abra **Production Safety Gate** — revise checks e próximos passos
7. Só avance para produção após revisão humana + checklist

## Código

| Artefato | Caminho |
|----------|---------|
| Gate engine | `packages/supabase/src/production-safety/ProductionSafetyGate.ts` |
| Hook HQ | `apps/headquarters/features/platform-supabase/production-safety/` |
| Widget | `apps/headquarters/components/widgets/ProductionSafetyWidget.tsx` |

## Referências

- `docs/operations/supabase-staging-validation.md`
- `docs/operations/supabase-migration-checklist.md`
- `docs/architecture/audit-edge-function.md`
- `docs/architecture/auth-operator-handoff.md`
- `docs/architecture/audit-pending-queue-cleanup.md`
