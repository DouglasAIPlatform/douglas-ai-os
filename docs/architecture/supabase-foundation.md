# Supabase Foundation — Douglas AI Platform

> Status: Foundation v1.0  
> Sprint: 5.19  
> Escopo: preparação técnica — **sem autenticação real nesta fase**.

## Objetivo

Estabelecer configuração, providers, tipos, health check e adapter de audit **preparados** para Supabase, sem exigir conexão real nem migrar dados.

A plataforma continua funcionando **sem variáveis Supabase** no ambiente local.

## Pacote `@douglas/supabase`

| Tipo | Função |
|------|--------|
| `SupabaseConfig` | URL, anon key, `isConfigured`, ambiente |
| `resolveSupabaseConfig()` | Leitura segura de env vars |
| `SupabaseEnvironment` | `local` \| `preview` \| `production` \| `unknown` |
| `SupabaseConnectionStatus` | `not_configured` \| `configured` \| `connected` \| `error` |
| `createSupabaseBrowserClient()` | Factory do cliente browser |
| `runSupabaseHealthCheck()` | Probe Auth API (+ tabela opcional) |
| `SupabaseProvider` | Contexto React |
| `useSupabase()` | Hook de consumo |

## Variáveis de ambiente

| Variável | Onde | Exposição |
|----------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` / Vercel | **Pública** (browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` / Vercel | **Pública** (browser) |

Exemplo: `.env.example` na raiz do monorepo.

### Configurar na Vercel

1. Project → **Settings** → **Environment Variables**
2. Adicionar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Escopos: Production, Preview (e Development se usar Vercel dev)
4. Redeploy após salvar

**Nunca** adicionar `service_role` ou secret keys como `NEXT_PUBLIC_*`.

## Provider tree (Headquarters)

```
EventProvider
  └── SupabaseIntegration
        ├── SupabaseProvider
        └── AuthSessionProvider (Sprint 5.21)
              └── DemoDataIntegration
                    └── … → widgets
```

Widgets técnicos em `/headquarters`: `SupabaseConnectionWidget`, `AuthStatusWidget`.

Ver também: [auth-foundation.md](./auth-foundation.md).

## Status de conexão

| Status | Condição |
|--------|----------|
| `not_configured` | Env vars ausentes ou inválidas |
| `configured` | Env vars OK, Auth OK, tabela audit ainda ausente |
| `connected` | Env vars OK + Auth OK (+ tabela probe OK se definida) |
| `error` | Falha de rede, URL inválida ou erro Auth |

Sem env vars → `not_configured` — **nenhuma requisição de rede**.

## Audit — migração localStorage → Supabase

### Hoje (Sprint 5.19)

| Adapter | Ativo | Storage |
|---------|-------|---------|
| `LocalStorageAuditPersistenceAdapter` | **Sim** | `localStorage` |
| `SupabaseAuditPersistenceAdapter` | **Não** | Postgres (preparado) |

Config Headquarters: `features/platform-audit/config.ts` — localStorage only.

### Adapter Supabase (preparado)

Arquivo: `packages/audit/src/SupabaseAuditPersistenceAdapter.ts`

- Implementa `AuditPersistenceAdapter`
- `enabled: false` por padrão (`DEFAULT_SUPABASE_AUDIT_PERSISTENCE_CONFIG`)
- Tabela alvo: `operational_audit_entries` (migration futura)
- **Falha segura:** erros de insert/select atualizam `persistenceStatus.error` — não quebram UI

### Ativação futura (Sprint dedicada)

1. Criar migration Supabase com tabela `operational_audit_entries` + RLS
2. Habilitar adapter em `AuditIntegration` com client de `useSupabase()`
3. Desligar localStorage ou usar dual-write temporário
4. Validar políticas RLS (`auth.uid()`, roles em `app_metadata`)

## Security — OperatorProvider mock → usuário autenticado

### Hoje

```tsx
// packages/security/src/OperatorProvider.tsx
const operator = MOCK_OPERATORS[role]; // role mock via setMockRole
```

`SecurityIntegration` usa `OperatorProvider` sem session real.

### Futuro (pós-auth Sprint)

```
Supabase Auth (session/JWT)
  └── AuthSessionProvider (novo)
        └── OperatorProvider operator={mapSessionToOperator(session)}
              └── ActionConfirmationProvider
```

Plano:

1. **`AuthSessionProvider`** — `supabase.auth.getSession()` / `onAuthStateChange`
2. **Mapear JWT → `Operator`** — role de `app_metadata` (nunca `user_metadata` para autorização)
3. **Remover `setMockRole`** em production; manter só em `development` + demo mode
4. **SecurityLayer** — propagar `actorId` real nos eventos audit
5. **RLS** — policies alinhadas com roles da plataforma

`OperatorProvider` **não foi removido** — contrato preservado; apenas a fonte do operador mudará.

## Riscos de segurança

| Risco | Mitigação atual | Futuro |
|-------|-----------------|--------|
| Anon key exposta no browser | Esperado — usar **apenas** anon/publishable key | RLS em todas as tabelas |
| `service_role` no client | Não usado | Nunca em `NEXT_PUBLIC_*` |
| Auth decisions via `user_metadata` | N/A (sem auth) | Usar `app_metadata` only |
| Audit tampering | localStorage local | RLS + insert-only policies |
| Session fixation | Auth desligado | `@supabase/ssr` + cookies httpOnly |
| Tabela audit sem RLS | Tabela não existe ainda | Migration com RLS before enable |

## O que falta para autenticação real

| Item | Sprint sugerida |
|------|-----------------|
| Tela de login / logout | 5.20+ |
| `@supabase/ssr` middleware Next.js | 5.20+ |
| `AuthSessionProvider` | 5.20+ |
| Substituir `MOCK_OPERATORS` | 5.21+ |
| Migration `operational_audit_entries` + RLS | **5.20** ✓ |
| Ativar `SupabaseAuditPersistenceAdapter` | 5.21+ |
| Migrar demo data / brain / memory | Supabase phase |

## Arquivos (Sprint 5.19)

| Arquivo | Alteração |
|---------|-----------|
| `packages/supabase/src/*` | Pacote foundation |
| `packages/audit/src/SupabaseAuditPersistenceAdapter.ts` | Adapter preparado |
| `features/platform-supabase/*` | Integração HQ |
| `components/widgets/SupabaseConnectionWidget.tsx` | Indicador técnico |
| `AppShell.tsx` | `SupabaseIntegration` |
| `.env.example` | Template de env vars |

## Referências

- `docs/architecture/supabase-schema-rls.md`
- `docs/architecture/audit-persistence-unification-architecture.md`
- `docs/architecture/safety-permissions-architecture.md`
- `docs/engineering/validation-pipeline.md`
