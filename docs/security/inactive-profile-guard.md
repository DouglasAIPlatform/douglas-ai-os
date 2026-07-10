# Inactive Profile Guard — Douglas AI Platform

> Sprint: 5.43  
> Escopo: profiles `invited` / `suspended` nunca geram operador autorizado no client-side handoff.

## Problema corrigido

Antes, um `operator_profiles` com `status !== 'active'` ainda produzia `operatorOverride` com role admin/owner no client — divergência com Edge Function e RLS (5.42) que já bloqueavam profile inativo.

## Estados de handoff

| Estado | Condição | RBAC efetivo |
|--------|----------|--------------|
| `authenticated_with_active_profile` | profile `active` | Profile autorizado |
| `authenticated_with_inactive_profile` | profile inativo + **development** | Fallback mock (com aviso) |
| `blocked_by_profile_status` | profile inativo + **staging/production** | Viewer forçado — bloqueado |
| `profile_missing` | autenticado sem row | Fallback mock |
| `profile_error` | erro ao carregar profile | Fallback mock |

Estados legados `authenticated_with_profile` / `authenticated_without_profile` permanecem no tipo para compatibilidade de eventos; `normalizeHandoffState()` mapeia para os novos.

## Componentes

| Arquivo | Responsabilidade |
|---------|------------------|
| `OperatorFallbackPolicy.ts` | `isActiveOperatorProfile`, `resolveHandoffState`, policy de fallback |
| `EffectiveOperatorResolver.ts` | Só profile ativo gera `operatorOverride` autorizado |
| `OperatorProfileMapper.ts` | Expõe `status` e `isActive` no mapeamento |
| `AuthOperatorBridge.tsx` | Propaga resolução para `OperatorProvider` |

## Política por ambiente

- **Development:** `allowsInactiveProfileMockFallback()` → true quando `@douglas/environment` permite mocks
- **Staging / Production:** profile inativo → `blocked_by_profile_status`, role efetiva `viewer`, `operatorSource: blocked`

Nunca cai silenciosamente em role poderosa do profile inativo.

## Compatibilidade Edge

- `AuditAuthorizationPolicy` — bloqueia `status !== 'active'` (inalterado)
- `ServerAuthorizationEvaluator` — `profile_inactive` (inalterado)
- Client handoff agora alinhado semanticamente

## Widgets (Headquarters)

- **AuthStatusWidget** — handoff state, profile status, bloqueio, owner vs admin — sem e-mail/UID/token
- **EnvironmentStatusWidget** — profile status + bloqueio na validação de ambiente
- **ProductionSafetyWidget** — role tier + badge de profile bloqueado

## Verificação

```bash
pnpm exec vitest run packages/supabase/src/auth/auth-handoff.rbac.test.ts
pnpm release:check   # inactive_profile_guard_present, owner_admin_handoff_tests_passing
```

## Limitações

- Guard é client-side — server enforcement completo depende de RLS + Edge (5.42) aplicados manualmente
- Profile `invited` tratado como inativo (não `active`)
- Fallback mock em dev ainda permite RBAC elevado via mock role — intencional com aviso explícito
