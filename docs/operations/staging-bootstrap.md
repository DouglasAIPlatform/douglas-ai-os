# Staging Bootstrap — Douglas AI Platform

> Sprint 5.47  
> Escopo: fundação operacional para ambiente staging real e separado.

## Objetivo

Preparar a codebase para executar Douglas AI OS em **development**, **staging** e **production**, com staging permitindo testes reais antes de production.

Staging deve suportar:

- Autenticação Supabase real
- `operator_profiles` com profile ativo
- Auditoria via Edge Function (`writeMode: edge_function`)
- RBAC server-side (migrations aplicadas manualmente)
- Dados isolados de production

## Por que projeto Supabase separado

- Isolamento de dados — staging nunca compartilha dados de production
- RLS e migrations testadas sem risco
- Edge Functions e secrets independentes
- Promoção controlada com revisão humana

**Nunca** reutilize `NEXT_PUBLIC_SUPABASE_URL` entre staging e production.

## Variáveis de ambiente

Documentadas em `.env.example` (placeholders vazios — sem valores reais):

```env
NEXT_PUBLIC_DOS_ENVIRONMENT=staging
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Nunca versionar

- `SUPABASE_SERVICE_ROLE_KEY`
- Tokens, senhas, project refs reais
- Secrets de Edge Function (configurar via Supabase Dashboard)

## Política de staging

| Requisito | Enforcement |
|-----------|-------------|
| `NEXT_PUBLIC_DOS_ENVIRONMENT=staging` | Resolver canônico |
| Mocks desligados | `EnvironmentProfile.staging` |
| Mock role bloqueada | `allowMockRoleChange: false` |
| Login real | `requireRealAuth: true` |
| Profile ativo | `requireAuthProfile: true` |
| Audit Edge Function | `writeMode: edge_function` |
| `AUDIT_INGEST_AUTH_MODE=required` | Supabase secrets (runtime) |
| RBAC server-side | Migrations 5.42–5.45 (apply manual) |
| Revisão humana antes de production | Processo operacional |

## Configuração futura na Vercel

Por ambiente no dashboard:

| Variável | Valor staging |
|----------|---------------|
| `NEXT_PUBLIC_DOS_ENVIRONMENT` | `staging` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto staging |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key do projeto staging |

`VERCEL_ENV=preview` é hint apenas — não substitui `NEXT_PUBLIC_DOS_ENVIRONMENT`.

## Apply manual de migrations

Ordem:

1. `20250707130000_platform_helpers.sql`
2. `20250707130001_operator_profiles.sql`
3. `20250707130002_operational_audit_entries.sql`
4. `20250707130003_operator_sessions.sql`
5. `20250710180000_server_rbac_enforcement.sql`
6. `20250710190000_owner_permission_seed.sql`
7. `20250710200000_owner_admin_rls_separation.sql`

Ver: [apply-supabase-migrations.md](./apply-supabase-migrations.md)

## Deploy manual da Edge Function

```bash
supabase functions deploy audit-ingest --project-ref <staging-ref>
supabase secrets set AUDIT_INGEST_AUTH_MODE=required --project-ref <staging-ref>
```

## Comandos

```bash
pnpm staging:check    # read-only — configuração estática + runtime pendente
pnpm release:check    # inclui checks de staging bootstrap
```

## Validação runtime

1. Configure variáveis na Vercel ou `.env.local`
2. Apply migrations no projeto staging
3. Deploy `audit-ingest`
4. Abra HQ — widgets **Staging Readiness** e **Production Safety Gate**
5. Confirme login real, profile ativo, audit accepted

## Promoção staging → production

1. `pnpm release:check` aprovado
2. Production Safety Gate verde em staging
3. Revisão humana (owner)
4. Apply migrations em production (projeto separado)
5. Deploy Edge Function em production
6. `NEXT_PUBLIC_DOS_ENVIRONMENT=production` na Vercel production
7. Gate final em production

## Módulos

| Módulo | Path |
|--------|------|
| Perfil staging | `packages/environment/src/staging-bootstrap/StagingEnvironmentProfile.ts` |
| Evaluator | `packages/environment/src/staging-bootstrap/StagingReadinessEvaluator.ts` |
| CLI runner | `packages/environment/src/staging-bootstrap/StagingReadinessRunner.ts` |
| HQ widget | `apps/headquarters/components/widgets/StagingReadinessWidget.tsx` |

## Referências

- [staging-validation-checklist.md](./staging-validation-checklist.md)
- [staging-production-environments.md](./staging-production-environments.md)
- [production-safety-gate.md](./production-safety-gate.md)
