# RBAC Verification Suite — Douglas AI Platform

> Status: Foundation v1.0  
> Sprint: 5.38  
> Escopo: prova reproduzível de que o RBAC client-side funciona conforme o catálogo.

## Objetivo

Validar por testes automatizados que as roles `owner`, `admin`, `operator` e `viewer`:

- executam apenas ações permitidas pelo catálogo;
- recebem bloqueio em ações proibidas;
- não elevam role via mock quando há auth profile ativo;
- respeitam política de mock role (dev vs production);
- resolvem corretamente o Auth → Operator Handoff.

## Comandos

```bash
pnpm test:rbac    # Suíte RBAC (Vitest, sem browser/Supabase remoto)
pnpm test         # Alias — executa todos os testes Vitest configurados
```

Integrado ao release readiness:

```bash
pnpm release:check   # inclui pnpm test:rbac como check bloqueante
```

## Framework

**Vitest** (Node, sem browser):

- Config: `vitest.config.ts` na raiz
- Testes: `*.rbac.test.ts` em `@douglas/security` e `@douglas/supabase`
- Sem conexão remota, localStorage real ou secrets

## Matriz de permissões

Derivada de `ROLE_PERMISSIONS` em `packages/security/src/Permission.ts`:

| Permission | viewer | operator | admin | owner |
|------------|--------|----------|-------|-------|
| `platform:view` | ✓ | ✓ | ✓ | ✓ |
| `runtime:refresh` | | ✓ | ✓ | ✓ |
| `runtime:health_check` | | ✓ | ✓ | ✓ |
| `runtime:pause` | | | ✓ | ✓ |
| `runtime:resume` | | | ✓ | ✓ |
| `runtime:restart` | | | ✓ | ✓ |
| `security:manage_roles` | | | | ✓ |
| `security:manage_owners` | | | | ✓ |
| `release:approve_production` | | | | ✓ |
| `platform:critical_configuration` | | | | ✓ |

### Capabilities mapeadas

| Capability | Permission / ação | Confirmação |
|------------|-------------------|-------------|
| Visualizar plataforma / audit trail | `platform:view` | Não |
| Refresh de módulo | `runtime:refresh` → `refresh_module` | Não |
| Health check | `runtime:health_check` → `run_health_check` | Não |
| Pausar / retomar / reiniciar módulo | `runtime:pause/resume/restart` | **Sim** |
| Operações administrativas | pause/resume/restart | Admin/owner only |

**Owner possui 4 permissões exclusivas** — admin não possui `OWNER_EXCLUSIVE_PERMISSIONS` (Sprint 5.43).

## Testes por role

### OWNER

- Todas as 6 permissões do catálogo
- Todas as 5 secured actions permitidas
- pause/resume/restart exigem confirmação (`requiresConfirmation: true`)

### ADMIN

- Permissões operacionais de runtime (6) — **sem** owner-exclusive
- Ações administrativas de runtime permitidas
- Não possui `security:manage_owners` nem demais permissões owner-only

### Profile inativo (handoff)

- Testado em `@douglas/supabase` — `auth-handoff.rbac.test.ts`
- Profile inativo **não** gera `operatorOverride` autorizado
- Staging/production → `blocked_by_profile_status` com viewer forçado

### OPERATOR

- refresh + health_check permitidos
- pause/resume/restart bloqueados (`blockedByPermission: true`)
- Sem acesso administrativo ou gestão de segurança

### VIEWER

- Apenas `platform:view` (visualizar audit trail incluído)
- Todas as runtime actions bloqueadas

## Auth → Operator Handoff

Testado em `packages/supabase/src/auth/auth-handoff.rbac.test.ts`:

| Cenário | Resultado esperado |
|---------|-------------------|
| Profile owner autenticado | `effectiveRole = owner`, `operatorSource = auth_profile` |
| Profile admin autenticado | `effectiveRole = admin` |
| Profile ausente | Fallback mock, `operatorSource = fallback`, warning |
| Erro de profile | Fallback mock |
| Mock role `owner` + profile `operator` | Profile vence — effective operator |
| Profile viewer | Runtime actions bloqueadas, view permitido |

### Profile inativo (limitação documentada)

Cliente **ainda resolve** auth profile com `status !== active` — enforcement de status inativo ocorre server-side (Edge Function `audit-ingest`) e no Production Safety Gate, não no `PermissionGuard`.

## Mock role policy

| Ambiente | `isMockRoleChangeAllowed()` |
|----------|----------------------------|
| `NODE_ENV !== "production"` | `true` |
| `NODE_ENV === "production"` | `false` |

UI de troca mock desabilitada quando `operatorSource === "auth_profile"`.

## RBAC client-side vs server-side

| Camada | O que enforce |
|--------|---------------|
| **Client** (`PermissionGuard`, `SecurityLayer`) | Runtime Control, confirmação de ações sensíveis, UX de bloqueio |
| **Server** (Edge `audit-ingest`, Postgres RLS) | Ingest remoto de audit, policies de banco |

Os testes desta suíte cobrem **client-side**. Não substituem validação de RLS ou Edge Function.

## Módulos

| Módulo | Função |
|--------|--------|
| `RBACPermissionMatrix` | Matriz derivada do catálogo |
| `RBACVerificationCase` | Definição de caso de teste |
| `RBACVerificationResult` | Resultado por caso |
| `RBACVerificationReport` | Agregação pass/fail |
| `RBACVerificationRunner` | Execução programática da suíte |

## Limitações atuais

| Item | Status |
|------|--------|
| Limpeza de pending queue (`AuditTrailWidget`) | **Sem RBAC client-side** — botões disponíveis a todas as roles |
| Gestão de segurança dedicada | Não há permission `security:*` — mapeada para runtime admin |
| Profile inativo no client | Não bloqueia RBAC local |
| Testes React (`OperatorProvider`) | Não incluídos — lógica pura TS |
| E2E browser | Fora de escopo desta sprint |

## Referências

- `docs/architecture/safety-permissions-architecture.md`
- `docs/architecture/auth-operator-handoff.md`
- `docs/architecture/audit-edge-role-authorization.md`
- `packages/security/src/Permission.ts`
- `packages/security/src/PermissionGuard.ts`
