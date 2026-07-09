# Supabase — Douglas AI Platform

> Sprint 5.20 — Schema & RLS foundation  
> **Não conecta automaticamente** ao projeto remoto. Apenas migrations versionadas.

## Estrutura

```
supabase/
├── migrations/     # SQL versionado (aplicar via Supabase CLI)
├── functions/      # Edge Functions (audit-ingest — Sprint 5.24)
├── seed/           # Seeds opcionais pós-auth
└── README.md
```

## Migrations

| Arquivo | Conteúdo |
|---------|----------|
| `20250707130000_platform_helpers.sql` | Enums, helpers RLS, `operator_role_permissions` |
| `20250707130001_operator_profiles.sql` | Perfis operacionais (`auth.users`) |
| `20250707130002_operational_audit_entries.sql` | Operational Audit Log |
| `20250707130003_operator_sessions.sql` | Sessões operacionais (futuro) |

## Pré-requisitos

- [Supabase CLI](https://supabase.com/docs/guides/cli) instalado
- Projeto Supabase criado (Dashboard)
- **Nunca** commitar `service_role` ou chaves reais

## Aplicar migrations (futuro — manual)

```bash
# Vincular projeto local ao remoto (uma vez)
supabase link --project-ref YOUR_PROJECT_REF

# Aplicar migrations pendentes
supabase db push

# Ou ambiente local para desenvolvimento
supabase start
supabase db reset   # aplica migrations + seed
```

## Variáveis de ambiente (app)

Ver `.env.example` na raiz e `docs/architecture/supabase-foundation.md`.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Tipos TypeScript

Tipos manuais em `packages/supabase/src/schema/` — **sem** `supabase gen types` nesta fase.

Mappers AuditEntry ↔ row: `packages/audit/src/SupabaseAuditRowMapper.ts`

## Segurança

- RLS **enabled** em todas as tabelas `public` criadas
- INSERT em audit **negado** para `anon`/`authenticated` — usar `service_role` ou Edge Function
- Roles de autorização via `operator_profiles.role` ou `app_metadata.role` — **nunca** `user_metadata`
- Policies dependem de `auth.uid()` — documentado em `docs/architecture/supabase-schema-rls.md`

## Referências

- `docs/operations/apply-supabase-migrations.md` — guia operacional (Sprint 5.23)
- `docs/operations/supabase-migration-checklist.md` — checklist
- `docs/architecture/audit-edge-function.md` — Edge Function audit-ingest (Sprint 5.24)
- `docs/architecture/supabase-schema-rls.md`
- `docs/architecture/supabase-foundation.md`

## Plano de migrations (somente leitura)

```bash
pnpm supabase:migration-plan
```
