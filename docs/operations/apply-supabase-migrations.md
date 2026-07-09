# Aplicar Migrations Supabase — Douglas AI Platform

> Sprint 5.23 — Migration Readiness  
> Escopo: processo operacional seguro. **O monorepo não aplica migrations automaticamente.**

## Objetivo

Aplicar as migrations versionadas em `supabase/migrations/` em um projeto Supabase (local ou remoto) com verificação, rollback consciente e sem expor secrets.

## Pré-requisitos

| Item | Obrigatório |
|------|-------------|
| [Supabase CLI](https://supabase.com/docs/guides/cli) | Sim |
| Projeto Supabase (Dashboard) | Sim, para remoto |
| Revisão do SQL local | Sim, antes de qualquer push |
| Backup ou projeto staging | Recomendado antes de produção |

### Variáveis necessárias (aplicação Next.js / Headquarters)

| Variável | Onde | Frontend? |
|----------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` / Vercel | Sim (pública) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` / Vercel | Sim (pública) |

### Chaves que **nunca** vão para o frontend

| Secret | Uso permitido |
|--------|---------------|
| `service_role` | Server, Edge Functions, CI protegido, migrations admin |
| Database password | Supabase CLI / conexão direta Postgres |
| JWT secret | Dashboard Supabase / server-side only |
| `SUPABASE_ACCESS_TOKEN` (CLI) | Máquina do operador, não commitar |

**Nunca** prefixar secrets com `NEXT_PUBLIC_`.

## Revisão das migrations (Sprint 5.20)

Ordem fixa — ver também `pnpm supabase:migration-plan`.

| # | Arquivo | Objetos | RLS |
|---|---------|---------|-----|
| 1 | `20250707130000_platform_helpers.sql` | Enums, helpers, `operator_role_permissions` | Sim |
| 2 | `20250707130001_operator_profiles.sql` | `operator_profiles` → `auth.users` | Sim |
| 3 | `20250707130002_operational_audit_entries.sql` | Audit operacional | Sim |
| 4 | `20250707130003_operator_sessions.sql` | Sessões futuras | Sim |

### Alinhamento com código

| Tabela | Pacote | Contrato |
|--------|--------|----------|
| `operational_audit_entries` | `@douglas/audit` | `SupabaseAuditRowMapper` — `audit_id`, `correlation_id`, `request_id` |
| `operator_profiles` | `@douglas/supabase/auth` | `OperatorProfileRow`, `mapOperatorProfileRow` |
| Roles | `@douglas/security` | `owner` \| `admin` \| `operator` \| `viewer` |

### Postura de segurança RLS (resumo)

- **Todas** as tabelas `public` criadas têm RLS enabled.
- **Audit:** INSERT negado para `anon` e `authenticated`; append-only (sem UPDATE/DELETE).
- **Sessions:** mutações negadas no client.
- **Profiles:** INSERT restrito a owner/admin — **primeiro owner** deve ser criado via Dashboard SQL ou `service_role` (bootstrap).
- **Roles:** resolvidas via `operator_profiles.role` ou `app_metadata.role` — **nunca** `user_metadata`.
- `operator_role_permissions`: SELECT aberto para `authenticated` (dados estáticos de referência).

## Como aplicar com segurança

### Ambiente local (recomendado primeiro)

```bash
# Na raiz do monorepo
supabase start
supabase db reset   # aplica todas migrations + seed (seed está comentado)
```

`db reset` **destrói** dados locais — aceitável apenas em dev.

### Ambiente remoto (staging / produção)

```bash
# Uma vez — substituir YOUR_PROJECT_REF pelo ref do Dashboard (não é secret)
supabase link --project-ref YOUR_PROJECT_REF

# Revisar diff antes de aplicar
supabase db diff --linked

# Aplicar migrations pendentes
supabase db push
```

**Checklist completo:** [supabase-migration-checklist.md](./supabase-migration-checklist.md)

## Validar tabelas após apply

No **SQL Editor** do Supabase Dashboard (sem colar secrets):

```sql
SELECT table_name, row_security
FROM information_schema.tables t
JOIN pg_class c ON c.relname = t.table_name
WHERE t.table_schema = 'public'
  AND t.table_name IN (
    'operator_profiles',
    'operational_audit_entries',
    'operator_sessions',
    'operator_role_permissions'
  );
```

Verificar colunas de audit:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'operational_audit_entries'
ORDER BY ordinal_position;
```

Campos esperados alinhados ao mapper: `audit_id`, `correlation_id`, `request_id`, `actor_id`, `metadata`, etc.

## Testar RLS

Executar no SQL Editor **como role authenticated** (simular JWT) ou via client autenticado:

| Teste | Esperado |
|-------|----------|
| `anon` SELECT em `operational_audit_entries` | 0 rows / denied |
| `authenticated` INSERT em `operational_audit_entries` | **Falha** (policy `WITH CHECK (false)`) |
| `authenticated` SELECT próprio `operator_profiles` | OK se perfil existir |
| `service_role` INSERT audit (server only) | OK (bypass RLS) |

Teste rápido de negação INSERT (authenticated):

```sql
-- Deve falhar com policy violation
INSERT INTO public.operational_audit_entries (source, action, actor_name)
VALUES ('platform', 'test', 'test');
```

## Validar na aplicação (Headquarters)

Com `.env.local` configurado (URL + anon key apenas):

1. **SupabaseConnectionWidget** — status `connected` se Auth OK + tabela audit existe (probe).
2. **AuthStatusWidget** — `supabase_ready` ou `unauthenticated` (login ainda não ativo).
3. **AuditTrailWidget** — modo persistência; fallback local se INSERT remoto falhar (esperado por RLS).

Sem env vars: status `not_configured` — UI **não quebra**.

## O que **nunca** fazer

- Commitar `.env.local` ou qualquer arquivo com keys reais.
- Colocar `service_role`, DB password ou JWT secret em `NEXT_PUBLIC_*`.
- Rodar `supabase db reset` em produção.
- Aplicar migrations em produção sem staging e backup.
- Desabilitar RLS “temporariamente” em produção.
- Logar URL completa + anon key em widgets, scripts ou CI output.
- Executar migrations a partir de `pnpm build` / CI sem revisão humana.

## Rollback manual básico

Supabase não faz “down migrations” automáticas neste repositório. Rollback é **manual e destrutivo**:

1. **Backup** via Dashboard → Database → Backups (ou `pg_dump` antes do push).
2. Identificar último estado bom.
3. Opções:
   - **Restore backup** no Dashboard (preferido).
   - **DROP** objetos criados (apenas dev/staging):

```sql
-- ATENÇÃO: destrutivo — apenas dev/staging com aprovação
DROP TABLE IF EXISTS public.operator_sessions CASCADE;
DROP TABLE IF EXISTS public.operational_audit_entries CASCADE;
DROP TABLE IF EXISTS public.operator_profiles CASCADE;
DROP TABLE IF EXISTS public.operator_role_permissions CASCADE;
-- Remover functions/enums conforme necessário
```

4. Remover registro da migration em `supabase_migrations.schema_migrations` **somente** se souber o que está fazendo (evitar drift).

Para produção: preferir **forward-fix** (nova migration corretiva) em vez de DROP.

## Advisors e pós-apply

```bash
supabase db advisors --linked
```

Revisar avisos de security e performance no Dashboard → Advisors.

## Script informativo

```bash
pnpm supabase:migration-plan
```

Lista ordem e resumo — **não aplica** nada.

## Referências

- [supabase-migration-checklist.md](./supabase-migration-checklist.md)
- [../architecture/supabase-schema-rls.md](../architecture/supabase-schema-rls.md)
- [../architecture/audit-migration-supabase.md](../architecture/audit-migration-supabase.md)
- [../../supabase/README.md](../../supabase/README.md)
