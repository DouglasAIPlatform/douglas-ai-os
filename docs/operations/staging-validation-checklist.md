# Staging Validation Checklist

> Sprint 5.47 — checklist read-only e reproduzível.

Execute `pnpm staging:check` para verificação estática automatizada. Itens marcados **runtime** exigem ambiente staging deployado.

## Status do staging:check

| Status | Significado | Exit code |
|--------|-------------|-----------|
| `passed` | Estáticos e runtime aprovados | 0 |
| `passed_with_runtime_checks_pending` | Estáticos OK; staging real **não** validado ainda | 0 |
| `failed` | Bloqueio estático ou runtime bloqueante | 1 |

Quando o ambiente efetivo é `development` (padrão local), é esperado `passed_with_runtime_checks_pending` — auth real, profile ativo e audit ingest ainda pendentes.

**Não interprete `passed_with_runtime_checks_pending` como staging deployado e validado.**

## Configuração estática (codebase)

- [ ] `StagingEnvironmentProfile` presente em `@douglas/environment`
- [ ] `EnvironmentProfile.staging`: mocks desligados, mock role bloqueada
- [ ] `auditSupabaseConfig.writeMode = edge_function`
- [ ] `.env.example` documenta `NEXT_PUBLIC_DOS_ENVIRONMENT=staging`
- [ ] Migrations esperadas presentes em `supabase/migrations/`
- [ ] `pnpm staging:check` disponível
- [ ] `pnpm release:check` inclui checks de staging

## Variáveis (staging deploy)

- [ ] `NEXT_PUBLIC_DOS_ENVIRONMENT=staging` (explícito)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` — projeto **separado** de production
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — do projeto staging
- [ ] **Não** usar service role key no frontend

## Supabase (apply manual)

- [ ] Migrations aplicadas na ordem documentada
- [ ] Tabelas: `operator_profiles`, `operator_role_permissions`, `operational_audit_entries`
- [ ] Helpers RBAC: `require_active_operator()`, `operator_has_permission()`
- [ ] RLS owner/admin separado (5.45)

## Edge Function

- [ ] `audit-ingest` deployada no projeto staging
- [ ] `AUDIT_INGEST_AUTH_MODE=required` via Supabase secrets
- [ ] **Não** expor service role no client

## Autenticação e RBAC (runtime)

- [ ] Auth API disponível
- [ ] Login real (sem mock operator)
- [ ] `operator_profile` com status `active`
- [ ] Role efetiva não mock
- [ ] Troca de mock role bloqueada no UI

## Auditoria (runtime)

- [ ] Último audit remoto `accepted`
- [ ] Fila de pendências controlada
- [ ] Fallback local tratado como alerta (não modo principal)

## Ambiente e release

- [ ] Sem mismatch crítico Vercel/DOS
- [ ] `pnpm release:check` aprovado
- [ ] Production Safety Gate ≥ `ready_for_staging`

## Promoção para production

- [ ] Revisão humana concluída
- [ ] Projeto Supabase production **separado**
- [ ] Migrations aplicadas em production
- [ ] Edge Function deployada em production
- [ ] `NEXT_PUBLIC_DOS_ENVIRONMENT=production` explícito

## Comandos

```bash
pnpm staging:check
pnpm release:check
pnpm rbac:drift-check
```
