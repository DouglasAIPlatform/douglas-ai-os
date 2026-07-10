# Owner / Admin Separation — Douglas AI Platform

> Sprint: 5.43  
> Escopo: separação mínima e segura entre owner e admin no catálogo RBAC.

## Objetivo

Owner e admin tinham permissões idênticas. A partir desta sprint, owner possui permissões críticas exclusivas; admin mantém administração operacional de runtime sem capacidade de promover owners ou alterar configuração crítica.

## Permissões exclusivas do owner

| Permission | Propósito |
|------------|-----------|
| `security:manage_roles` | Gerenciar roles operacionais (policy/gates futuros) |
| `security:manage_owners` | Gerenciar owners — admin **não** promove owner |
| `release:approve_production` | Aprovar release em produção |
| `platform:critical_configuration` | Configuração crítica da plataforma |

Não há UI funcional para estas ações nesta sprint — servem para matriz, testes, release readiness e enforcement futuro.

## Matriz por role

| Role | Permissões | Runtime admin | Owner-exclusive |
|------|------------|---------------|-----------------|
| **viewer** | `platform:view` | Não | Não |
| **operator** | view + refresh + health_check | Não | Não |
| **admin** | view + runtime completo | Sim | **Não** |
| **owner** | admin + 4 exclusivas | Sim | **Sim** |

## Fonte canônica

- `packages/security/src/Permission.ts` — `ROLE_PERMISSIONS`, `OWNER_EXCLUSIVE_PERMISSIONS`
- `packages/security/src/rbac-verification/RBACPermissionMatrix.ts` — matriz derivada
- Edge: `supabase/functions/audit-ingest/ServerPermissionCatalog.ts` — espelho manual

## Client vs server

- **Client:** `PermissionGuard` usa catálogo `@douglas/security`
- **Edge / SQL:** catálogo espelhado; ingest remoto continua exigindo `runtime:refresh` (operator+)
- **RLS:** migration 5.42 ainda usa `has_platform_role(ARRAY['owner','admin'])` — owner-exclusive ainda não tem políticas SQL dedicadas

## Limitações

- Seed `operator_role_permissions` no Postgres ainda reflete catálogo pré-5.43 até nova migration manual
- Permissões owner-exclusive não têm UI — apenas gates e testes
- Admin ainda compartilha pause/resume/restart com owner (operacional)

## Verificação

```bash
pnpm test:rbac
pnpm release:check   # owner_admin_separation_verified
```
