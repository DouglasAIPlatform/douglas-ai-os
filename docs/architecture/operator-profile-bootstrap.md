# Operator Profile Bootstrap — Douglas AI Platform

> Status: Bootstrap v1 (Sprint 5.29)  
> Escopo: orientação segura para o primeiro `operator_profiles` — **sem INSERT automático pelo browser**.

## Problema

Após login Supabase (Sprint 5.25) e handoff auth → operator (Sprint 5.26), usuários autenticados **sem** row em `operator_profiles` continuam com **fallback mock** para RBAC.

A migration `20250707130001_operator_profiles.sql` define RLS:

- **SELECT** — usuário lê o próprio perfil; owner/admin leem todos
- **INSERT** — apenas `has_platform_role(['owner','admin'])`

Consequência: o **primeiro owner** não pode ser criado pelo client browser (anon/authenticated). Exige processo administrativo com `service_role`.

## Objetivo desta sprint

Melhorar a experiência quando profile ausente:

- Status claro (`OperatorProfileBootstrapStatus`)
- Recomendações passo a passo (`OperatorProfileBootstrapRecommendation`)
- Widget em Headquarters (`OperatorProfileBootstrapWidget`)
- API preparada `requestOperatorProfileBootstrap()` — **sem escrita insegura**

## Estados (`OperatorProfileBootstrapStatus`)

| Status | Condição |
|--------|----------|
| `not_configured` | Sem env Supabase |
| `not_authenticated` | Sem sessão ativa |
| `profile_found` | `operator_profiles` carregado |
| `profile_missing` | Autenticado, profile null, probe inconclusivo |
| `bootstrap_required` | Tabela ausente — migrations primeiro |
| `bootstrap_blocked_by_rls` | Tabela OK, sem profile — INSERT client bloqueado |

## Por que o primeiro owner precisa de cuidado

| Risco | Mitigação |
|-------|-----------|
| Escalada via self-INSERT | RLS exige owner/admin pré-existente |
| service_role no frontend | **Nunca** — apenas SQL Editor / Edge Function server-side |
| Owner automático sem auditoria | Bootstrap manual documentado nesta sprint |
| Role errada no primeiro INSERT | SQL revisado + checklist ops |

## Criar manualmente o primeiro operator_profile

Pré-requisitos:

1. Migrations aplicadas (`operator_profiles` existe)
2. Usuário criado em Supabase Auth (Dashboard ou sign-up)
3. `user_id` conhecido (widget exibe SQL hint com id da sessão — **não** expõe tokens)

```sql
-- SQL Editor Supabase (service_role) — Sprint 5.29
INSERT INTO public.operator_profiles (user_id, display_name, role, status)
VALUES (
  '<uuid-do-auth.users>',
  'Platform Owner',
  'owner',
  'active'
);
```

Depois:

1. Logout/login ou **Atualizar sessão** no Auth widget
2. **Reverificar profile** no Operator Profile Bootstrap widget
3. Confirmar `profile_found` + handoff `authenticated_with_profile`

## API

| Função | Comportamento |
|--------|---------------|
| `resolveOperatorProfileBootstrap()` | Read-only — probe tabela + snapshot sessão |
| `requestOperatorProfileBootstrap()` | Recarrega profile (SELECT); **nunca INSERT**; retorna recomendação |

```typescript
// Sprint 5.29 — clientBootstrapAttempted sempre false
const result = await requestOperatorProfileBootstrap({
  config,
  client,
  session,
  reloadProfile: () => adapter.loadProfile(userId),
});
```

## Headquarters

Widget: **Operator Profile Bootstrap** em `/headquarters` (após Auth Status).

Exibe:

- Status bootstrap
- Email autenticado (sem tokens/keys)
- Presença de `operator_profiles`
- Role efetiva + fonte (`mock` | `fallback` | `auth_profile`)
- Passos recomendados + SQL hint
- Aviso fallback mock

Botões:

- **Reverificar profile** — probe read-only
- **Solicitar orientação de bootstrap** — `requestOperatorProfileBootstrap()` + refresh sessão

## Automatização futura

| Abordagem | Sprint |
|-----------|--------|
| Edge Function `operator-profile-bootstrap` com service_role + convite | Futura |
| Admin flow com confirmação MFA | Futura |
| Trigger pós-sign-up (cuidado com role default) | Avaliar riscos |

Sprint 5.29 **não** ativa nenhum destes fluxos.

## Arquivos

| Path | Papel |
|------|-------|
| `packages/supabase/src/auth/bootstrap/*` | Engine bootstrap |
| `apps/headquarters/features/platform-auth/useOperatorProfileBootstrap.ts` | Hook HQ |
| `apps/headquarters/components/widgets/OperatorProfileBootstrapWidget.tsx` | UI |

## Relação com handoff (5.26)

```
Login OK + sem profile → bootstrap_blocked_by_rls
                      → fallback mock (OperatorProvider)
                      → aviso em Auth + Bootstrap widgets

Login OK + profile     → auth_profile → operatorOverride → PermissionGuard
```

## Referências

- [auth-operator-handoff.md](./auth-operator-handoff.md)
- [../operations/apply-supabase-migrations.md](../operations/apply-supabase-migrations.md)
- [../operations/supabase-staging-validation.md](../operations/supabase-staging-validation.md)
