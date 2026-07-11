# Server-Side RBAC Enforcement — Douglas AI Platform

> Sprint: 5.42  
> Escopo: fundação de enforcement server-side reproduzível — **sem substituir** o RBAC client-side.

## Client guard vs server enforcement

| Camada | Local | Função |
|--------|-------|--------|
| **Client** | `@douglas/security` PermissionGuard | UX, confirmação, feedback imediato |
| **Server** | Postgres RLS + helpers SQL | Autorização real em dados |
| **Edge** | `audit-ingest` | Actor derivado do profile; viewer bloqueado |

O client-side **continua necessário** para experiência do operador. O server-side **reduz** confiança no payload do browser.

## Catálogo compartilhado

Permissões (client = server):

- `platform:view`
- `runtime:refresh`
- `runtime:health_check`
- `runtime:pause`
- `runtime:resume`
- `runtime:restart`

Tipos em `@douglas/security/server-authorization`:

- `ServerPermission`
- `ServerAuthorizationContext`
- `ServerAuthorizationDecision`
- `ServerAuthorizationReason`
- `OperatorAuthorizationSnapshot`

## auth.uid() e operator_profiles

Helpers SQL (migration `20250710180000_server_rbac_enforcement.sql`):

| Helper | Função |
|--------|--------|
| `current_operator_profile()` | Row ativo para `auth.uid()` |
| `current_operator_role()` | Role do profile ativo (sem JWT fallback) |
| `operator_has_permission(text)` | Join profile + `operator_role_permissions` |
| `require_active_operator()` | Profile `active` obrigatório |
| `can_promote_to_owner()` | `security:manage_owners` (Sprint 5.45) |
| `can_manage_operational_roles()` | `security:manage_roles` (Sprint 5.45) |
| `is_active_admin_operator()` | Admin active sem owner-exclusive (5.45) |

**Regra:** role do payload HTTP **nunca** autoriza — apenas `operator_profiles` ativo.

## Edge Function audit-ingest

- Autentica JWT via anon key + `getUser`
- Lookup `operator_profiles` via service_role (server only)
- `evaluateOperatorAuthorization` usa catálogo server-side
- Viewer bloqueado (sem `runtime:refresh`)
- Profile inativo → `profile_inactive`
- Respostas sanitizadas (sem secrets)

## Limitações até apply manual

Aplicar em ordem: `20250710180000` → `20250710190000` → `20250710200000`.

Até apply manual:

- RLS em produção permanece na versão anterior
- Helpers e policies owner/admin separadas indisponíveis no banco remoto
- Edge Function já aplica lógica server-side via lookup de profile

## Testes

- `server-authorization.rbac.test.ts`
- `owner-permission-seed.rbac.test.ts`
- `owner-admin-rls-separation.rbac.test.ts`
- Verificação estática SQL (`ServerRbacSqlVerification.ts`, `OwnerAdminRlsVerification.ts`)

## Referências

- [RBAC RLS Policies](../database/rbac-rls-policies.md)
- [RBAC Verification Suite](./rbac-verification-suite.md)
- [Audit Edge Function](../architecture/audit-edge-function.md)
