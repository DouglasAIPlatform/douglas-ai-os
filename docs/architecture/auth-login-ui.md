# Auth Login UI — Douglas AI Platform

> Status: Foundation v1.0  
> Sprint: 5.25  
> Escopo: login/logout email+senha — **RBAC mock permanece**.

## Objetivo

Primeira UI mínima de autenticação Supabase na Douglas AI OS, com persistência de sessão no browser, sem quebrar ambiente local sem env vars e **sem substituir** `OperatorProvider` mock.

## Fluxo de login

```
/login (LoginForm)
  └── useAuthSession().signIn({ email, password })
        └── SupabaseAuthAdapter.signInWithPassword()
              └── supabase.auth.signInWithPassword()
                    └── sessão persistida (localStorage via supabase-js)
                          └── onAuthStateChange → AuthSessionProvider
                                └── status: authenticated
```

Logout:

```
LogoutButton → signOut() → supabase.auth.signOut() → unauthenticated
```

## Persistência de sessão

`createSupabaseBrowserClient()` (Sprint 5.25):

| Opção | Valor |
|-------|-------|
| `persistSession` | `true` |
| `autoRefreshToken` | `true` |
| `detectSessionInUrl` | `true` |
| `storage` | `localStorage` (browser) |

Sem env Supabase → client `null` → status `not_configured` — **UI intacta**.

## Status possíveis

| Status | Modo | UI |
|--------|------|-----|
| `not_configured` | `mock` | LoginForm mostra aviso de config |
| `loading` | `supabase_ready` | Carregando sessão |
| `unauthenticated` | `supabase_ready` | LoginForm ativo |
| `authenticated` | `authenticated` | LogoutButton + email visível |
| `error` | `supabase_ready` | Mensagem de erro |

## Componentes (Headquarters)

| Componente | Local | Função |
|------------|-------|--------|
| `LoginForm` | `features/platform-auth/components/` | Email, senha, submit, erros |
| `LogoutButton` | idem | signOut quando autenticado |
| `AuthPanel` | idem | Painel combinado login/logout + status |
| `AuthModeBadge` | idem | Badges status + modo |
| `LoginPage` | `/login` | Página dedicada |
| `AuthStatusWidget` | `/headquarters` | Widget técnico evoluído |

## Modo mock / RBAC

```
AuthSessionProvider (sessão real)
        │
        │  bridge preparada
        ▼
OperatorProvider (MOCK — RBAC efetivo)
        │
        ▼
SecurityLayer / audit actor = mock id
```

Login **não altera** role efetiva de permissões nesta sprint.

`resolveAuthOperatorBridge()` continua retornando `isUsingMockOperator: true`.

## Segurança

| Regra | Implementação |
|-------|---------------|
| Não exibir tokens | UI mostra apenas email/status |
| Não exibir anon key | Widgets genéricos |
| Não armazenar senha | Controlled inputs; Supabase gerencia sessão |
| Não usar service_role | Apenas anon client + Auth API |
| Senha não persiste | Limpa após login bem-sucedido |

JWT fica em storage gerenciado pelo `@supabase/supabase-js` — não logar nem renderizar.

## Arquivos principais

| Path | Papel |
|------|-------|
| `packages/supabase/src/SupabaseClientFactory.ts` | Persistência sessão |
| `packages/supabase/src/auth/AuthSessionProvider.tsx` | signIn / signOut |
| `packages/supabase/src/auth/SupabaseAuthAdapter.ts` | Auth API |
| `apps/headquarters/app/login/page.tsx` | Rota `/login` |
| `apps/headquarters/features/platform-auth/components/*` | UI |

## O que falta para RBAC real

1. **`OperatorProvider` handoff** — prop `operatorOverride` quando autenticado + profile carregado
2. **Bootstrap `operator_profiles`** — owner inicial via service_role / Dashboard
3. **Desabilitar `setMockRole`** fora de development
4. **Audit actor** — mapear `actor_id` para UUID auth real
5. **Proteção de rotas** — redirect `/login` quando auth obrigatório (opcional por ambiente)
6. **Edge Function audit** — deploy + `writeMode: edge_function`

## Referências

- [auth-foundation.md](./auth-foundation.md)
- [supabase-foundation.md](./supabase-foundation.md)
