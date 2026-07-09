# Supabase Schema & RLS — Douglas AI Platform

> Status: Foundation v1.0  
> Sprint: 5.20  
> Escopo: migrations SQL + tipos TS + políticas RLS — **sem auth/login ativo**.

## Objetivo

Primeira estrutura de banco da Douglas AI OS no padrão Supabase:

- Usuários operacionais (`operator_profiles`)
- Audit log operacional (`operational_audit_entries`)
- Sessões futuras (`operator_sessions`)
- Roles e permissões (`operator_role_permissions` + enums)

Migrations vivem em `supabase/migrations/`. **Não são aplicadas automaticamente** pelo monorepo.

## Tabelas

### `operator_profiles`

| Coluna | Tipo | Objetivo |
|--------|------|----------|
| `id` | uuid PK | Identificador do perfil |
| `user_id` | uuid FK → `auth.users` | Vínculo com Supabase Auth |
| `display_name` | text | Nome exibido (substitui mock operator name) |
| `role` | enum | `owner` \| `admin` \| `operator` \| `viewer` |
| `status` | enum | `active` \| `invited` \| `suspended` |
| `metadata` | jsonb | Extensível (departamento, etc.) |
| `created_at` / `updated_at` | timestamptz | Auditoria de perfil |

**Objetivo:** substituir `MOCK_OPERATORS` quando auth estiver ativo. Um registro por usuário autenticado.

### `operational_audit_entries`

| Coluna | Tipo | Objetivo |
|--------|------|----------|
| `id` | uuid PK | ID gerado pelo banco |
| `timestamp` | timestamptz | Momento do evento |
| `actor_id` | text | ID do ator (futuro: `auth.uid()::text`) |
| `actor_name` | text | Nome legível |
| `actor_role` | text | Role no momento do evento |
| `source` | text | security \| runtime \| diagnostics \| platform |
| `action` | text | Ação auditada |
| `target` | text | Alvo da ação |
| `severity` | text | info \| warning \| error \| critical |
| `message` | text | Mensagem humana |
| `correlation_id` | text | Correlação cross-sistema |
| `request_id` | text | ID de request |
| `audit_id` | text | ID estável da app (`op-audit-*`) |
| `metadata` | jsonb | Payload estendido |
| `created_at` | timestamptz | Insert time |

**Objetivo:** persistência remota do `@douglas/audit`. Mapeamento via `SupabaseAuditRowMapper`.

### `operator_sessions`

Sessões operacionais **complementares** ao JWT Auth — para revogação, auditoria de dispositivos, etc.

| Coluna | Notas |
|--------|-------|
| `session_token_hash` | Apenas hash — nunca token raw |
| `expires_at` / `revoked_at` | Lifecycle |
| `status` | active \| revoked \| expired |

**Objetivo:** preparado para Sprint de auth; sem uso ativo no client.

### `operator_role_permissions`

Tabela de referência espelhando `ROLE_PERMISSIONS` de `@douglas/security`.

Somente leitura para `authenticated`. Mutações via migrations ou `service_role`.

## RLS — visão geral

Todas as tabelas têm `ENABLE ROW LEVEL SECURITY`.

### Dependência de `auth.uid()`

Funções helper (migration `20250707130000`):

| Função | Depende de | Uso |
|--------|------------|-----|
| `current_auth_user_id()` | `auth.uid()` | Retorna UUID da sessão |
| `current_operator_role()` | `auth.uid()` + `operator_profiles` / `app_metadata.role` | Resolve role |
| `has_platform_role(text[])` | `current_operator_role()` | Gate genérico |
| `can_read_full_audit_log()` | role ∈ owner, admin | SELECT audit completo |
| `can_read_limited_audit_log()` | role ∈ operator, viewer | SELECT limitado |

**Importante:** policies só funcionam com JWT autenticado. Cliente anônimo não lê audit nem perfis.

**`app_metadata.role`:** fallback documentado quando perfil ainda não existe. Deve ser setado **server-side** (Edge Function, admin API). **Nunca** usar `user_metadata` para autorização (Supabase security guidance).

### `operational_audit_entries`

| Operação | Quem | Policy |
|----------|------|--------|
| SELECT | owner, admin | Todos os registros |
| SELECT | operator | `actor_id = auth.uid()::text` |
| SELECT | viewer | `severity IN ('info', 'warning')` |
| INSERT | authenticated / anon | **NEGADO** (`WITH CHECK (false)`) |
| INSERT | service_role | Bypass RLS (Edge/server futuro) |
| UPDATE / DELETE | todos | **NEGADO** (append-only) |

### `operator_profiles`

| Operação | Quem |
|----------|------|
| SELECT | Próprio perfil (`user_id = auth.uid()`) |
| SELECT | owner, admin (todos) |
| UPDATE | Próprio (sem alterar role/status) |
| UPDATE | owner, admin (gerenciamento) |
| INSERT | owner, admin |
| DELETE | owner |

### `operator_sessions`

| Operação | Quem |
|----------|------|
| SELECT | Próprias sessões; owner/admin todas |
| INSERT/UPDATE/DELETE | Negado no client — futuro server |

## Tipos TypeScript

| Local | Conteúdo |
|-------|----------|
| `packages/supabase/src/schema/PlatformSchemaTypes.ts` | Row types + `SUPABASE_TABLES` |
| `packages/audit/src/SupabaseAuditRowMapper.ts` | `AuditEntry` ↔ row |

Sem `supabase gen types` nesta fase — tipos manuais versionados com migrations.

## Como aplicar migrations

1. Instalar Supabase CLI
2. `supabase link --project-ref <ref>` (projeto remoto)
3. Revisar SQL em `supabase/migrations/`
4. `supabase db push` ou `supabase db reset` (local)
5. Validar advisors: `supabase db advisors` (CLI 2.81.3+)

**O monorepo não executa migrations no `pnpm build`.** Ambiente sem Supabase configurado permanece funcional.

## Uso futuro — autenticação

```
Supabase Auth signup/login
  → trigger/Edge Function cria operator_profiles
  → app_metadata.role setado server-side
  → OperatorProvider lê perfil via session (Sprint 5.21+)
  → RLS usa auth.uid() + current_operator_role()
```

## Uso futuro — auditoria

```
Event Bus → AuditProvider → Edge Function / server route
  → insert operational_audit_entries (service_role)
  → client lê via SELECT policies (owner/admin/operator/viewer)
```

Adapter `@douglas/audit` permanece **desligado** (`enabled: false`). INSERT via browser anon key falharia por RLS — comportamento esperado.

## Riscos

| Risco | Mitigação |
|-------|-----------|
| INSERT audit via anon key | Policies negam INSERT |
| Escalada via `user_metadata` | Usar apenas `app_metadata` / `operator_profiles` |
| service_role no client | Nunca expor; apenas server/Edge |
| Policies operator/viewer incompletas | Documentado como "futuro"; revisar antes de auth |
| Migration não aplicada | Health check mostra `configured` (tabela ausente) |
| `auth.uid()` NULL em dev mock | RLS bloqueia — mock operators continuam sem DB |

## Relação com sprints anteriores

| Sprint | Entrega |
|--------|---------|
| 5.19 | `@douglas/supabase`, adapter preparado, widget status |
| **5.20** | **Schema + RLS + tipos** |
| 5.21+ (recomendado) | Auth SSR, ativar adapter via server, seed operators |

## Arquivos

| Path | Descrição |
|------|-----------|
| `supabase/migrations/*.sql` | Migrations |
| `supabase/seed/seed.sql` | Seed comentado |
| `supabase/README.md` | Guia CLI |
| `packages/supabase/src/schema/*` | Tipos TS |
| `packages/audit/src/SupabaseAuditRowMapper.ts` | Mappers |

## Referências

- `docs/architecture/supabase-foundation.md`
- `docs/architecture/audit-persistence-unification-architecture.md`
- `docs/architecture/safety-permissions-architecture.md`
