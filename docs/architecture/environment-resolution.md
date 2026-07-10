# Environment Resolution — Douglas AI Platform

> Sprint: 5.41  
> Fonte canônica: `@douglas/environment`

## Problema

Três modelos coexistiam com interpretações distintas:

| Modelo | Valores | Risco |
|--------|---------|-------|
| `@douglas/environment` | development / staging / production | Canônico (DOS) |
| `@douglas/core/Environment` | development / staging / production | Defaults hardcoded |
| `@douglas/supabase/SupabaseEnvironment` | local / preview / production | Inferia de VERCEL_ENV |

## Solução

**Uma fonte canônica:** `resolveCanonicalEnvironment()` em `@douglas/environment`.

### Precedência (ordem explícita)

1. **`NEXT_PUBLIC_DOS_ENVIRONMENT`** — canônico; define ambiente efetivo e políticas
2. **`DOS_ENVIRONMENT`** — server/deploy (secundário; alerta se divergir do público)
3. **`VERCEL_ENV`** — hint apenas; **nunca promove para production**
4. **default `development`**

### Regras de segurança

- Production **somente** com `NEXT_PUBLIC_DOS_ENVIRONMENT=production` explícito
- `VERCEL_ENV=preview` mapeia hint → staging (nunca production)
- `VERCEL_ENV=production` + DOS staging → **mismatch crítico**
- Valor DOS inválido → development + warning
- Nenhuma promoção automática para production

## Tipos (Sprint 5.41)

| Tipo | Função |
|------|--------|
| `CanonicalEnvironmentResolver` | API de resolução |
| `EnvironmentSource` | Origem detectada (dos_public, vercel_env, …) |
| `EnvironmentResolution` | Resultado completo |
| `EnvironmentMismatch` | Divergência warning/critical |
| `EnvironmentCompatibilityReport` | Compatibilidade agregada |
| `ReleaseChannel` | development \| staging \| production |

## Adapters de compatibilidade

| Adapter | Local | Delegação |
|---------|-------|-----------|
| `CoreEnvironmentAdapter` | `@douglas/environment` | core name ↔ platform (1:1) |
| `VercelEnvAdapter` | `@douglas/environment` | VERCEL_ENV → hint |
| `SupabaseEnvironmentAdapter` | `@douglas/environment` | platform → local/preview/production |
| `resolveSupabaseEnvironment` | `@douglas/supabase` | Delega ao canônico |
| `createCoreEnvironmentFromCanonical` | `@douglas/environment` | Factory para `@douglas/core` |

## Integrações

- **EnvironmentStatusWidget** — canônico, fontes, divergência, política
- **Production Safety Gate** — 5 checks adicionais de unificação
- **Release Readiness** — resolver, adapters, anti-production-default, docs

## Referências

- [Environment Separation](./environment-separation.md)
- [Staging / Production](../operations/staging-production-environments.md)
