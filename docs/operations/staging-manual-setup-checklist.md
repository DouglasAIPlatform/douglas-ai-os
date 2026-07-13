# Staging Manual Setup Checklist

> Sprint 5.53 — passos manuais após `pnpm staging:bootstrap-plan`.

## Antes de começar

- [ ] Codebase passou `pnpm release:check`
- [ ] `pnpm staging:check` com status `passed_with_runtime_checks_pending` (esperado sem remoto)
- [ ] Templates `.env.example` e `.env.staging.example` revisados

## Projeto Supabase

- [ ] Projeto staging criado (separado de production)
- [ ] URL e anon key obtidas com segurança
- [ ] `.env.staging.local` preenchido (não commitado)
- [ ] `supabase link` ao project ref staging (manual)

## Database

- [ ] `pnpm supabase:migration-plan` revisado
- [ ] Migrations aplicadas manualmente na ordem
- [ ] Tabelas RBAC + `mission_executions` presentes

## Edge Function

- [ ] `AUDIT_INGEST_AUTH_MODE=required` via Supabase secrets
- [ ] `audit-ingest` deployada no projeto staging
- [ ] Production Safety Gate — edge function OK

## Identidade

- [ ] Usuário Auth criado no staging
- [ ] `operator_profile` owner com status `active`

## Validação runtime

- [ ] Login real no HQ staging (sem mock)
- [ ] Audit remoto `accepted`
- [ ] Mission persistence `supabase_required` sem fallback session
- [ ] `pnpm staging:check` com env staging configurado
- [ ] StagingReadinessWidget — runtime validado

## Aprovação

- [ ] Revisão humana concluída
- [ ] Production Safety Gate ≥ `ready_for_staging`
- [ ] Nenhum blocker no widget de staging

## Comandos

```bash
pnpm staging:bootstrap-plan
pnpm staging:check
pnpm release:check
```
