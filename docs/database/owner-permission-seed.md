# Owner Permission Seed — Douglas AI Platform

> Sprint: 5.44  
> Migration: `20250710190000_owner_permission_seed.sql`  
> **Não aplicada remotamente** nesta fase.

## Objetivo

Sincronizar `operator_role_permissions` no Postgres com `OWNER_EXCLUSIVE_PERMISSIONS` de `@douglas/security`, que existem no catálogo TypeScript desde a Sprint 5.43 mas ainda não estavam no banco.

## Permissões registradas (role `owner` only)

| permission | description |
|------------|-------------|
| `security:manage_roles` | Gerenciar roles operacionais |
| `security:manage_owners` | Gerenciar owners |
| `release:approve_production` | Aprovar release em produção |
| `platform:critical_configuration` | Configuração crítica da plataforma |

## Por que owner ≠ admin

Admin mantém administração operacional de runtime (pause/resume/restart). Owner adiciona capacidades críticas de governança que admin **não** recebe — especialmente `security:manage_owners` (admin não promove owner) e `release:approve_production`.

A função `operator_has_permission()` (Sprint 5.42) consulta esta tabela — até o seed ser aplicado, owner-exclusive não é enforced no Postgres mesmo com catálogo TS correto.

## Schema

Derivado de `20250707130000_platform_helpers.sql`:

```sql
operator_role_permissions (
  role platform_operator_role NOT NULL,
  permission text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role, permission)
)
```

## Idempotência

1. **DELETE defensivo** — remove owner-exclusive erroneamente concedidas a `admin`, `operator` ou `viewer`
2. **INSERT … ON CONFLICT (role, permission) DO UPDATE** — reexecutar a migration não duplica rows; atualiza `description`

Não remove permissões compartilhadas existentes (runtime, platform:view, etc.).

## Segurança

- Nenhum INSERT para admin/operator/viewer
- Nenhum GRANT ou policy para `anon`
- Nenhuma alteração de RLS nesta migration
- Role derivada via `operator_profiles` + `operator_has_permission()` — não do payload do browser

## Aplicação manual

1. Revisar SQL em staging
2. Aplicar após `20250710180000_server_rbac_enforcement.sql`
3. Validar:

```sql
SELECT role, permission FROM operator_role_permissions
WHERE permission IN (
  'security:manage_roles',
  'security:manage_owners',
  'release:approve_production',
  'platform:critical_configuration'
)
ORDER BY role, permission;
-- Esperado: 4 rows, todas role = owner
```

## Verificação local

```bash
pnpm exec vitest run packages/security/src/server-authorization/owner-permission-seed.rbac.test.ts
pnpm release:check   # checks owner_permission_seed_*
```

## Fonte canônica TypeScript

`packages/security/src/Permission.ts` — `OWNER_EXCLUSIVE_PERMISSIONS`, `ROLE_PERMISSIONS`
