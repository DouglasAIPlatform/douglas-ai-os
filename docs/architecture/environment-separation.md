# Environment Separation — Douglas AI Platform

> Status: Foundation v1.1  
> Sprint: 5.39 / **5.41 (unificação canônica)**  
> Escopo: camada central de ambientes para impedir configuração de dev em staging/produção.

**Sprint 5.41:** `@douglas/environment` é a **fonte canônica única**. `@douglas/core/Environment` e `@douglas/supabase/SupabaseEnvironment` delegam via adapters. Ver [environment-resolution.md](./environment-resolution.md).

## Ambientes oficiais

| Ambiente | Variável | Default |
|----------|----------|---------|
| `development` | `NEXT_PUBLIC_DOS_ENVIRONMENT=development` | **Sim** (quando ausente) |
| `staging` | `NEXT_PUBLIC_DOS_ENVIRONMENT=staging` | — |
| `production` | `NEXT_PUBLIC_DOS_ENVIRONMENT=production` | — |

Variável **pública** (browser-safe) — não contém secrets.

## Pacote `@douglas/environment`

Camada de resolução e políticas — **não duplica** `@douglas/core/Environment`:

| Módulo | Função |
|--------|--------|
| `PlatformEnvironment` | Tipo + labels (`development` \| `staging` \| `production`) |
| `EnvironmentProfile` | Políticas operacionais por ambiente |
| `EnvironmentConfig` | Config resolvida (core + profile) |
| `EnvironmentConfigResolver` | Delega a `resolveCanonicalEnvironment` |
| `CanonicalEnvironmentResolver` | Precedência DOS → server → VERCEL hint → default |
| `EnvironmentSafetyPolicy` | Avalia compatibilidade runtime |
| `EnvironmentValidationResult` | Issues + snapshot seguro para UI |

### Políticas por ambiente

| Política | development | staging | production |
|----------|:-----------:|:-------:|:----------:|
| Mocks permitidos | ✓ | ✗ | ✗ |
| Mock role permitida | ✓ | ✗ | ✗ |
| Fallback local | ✓ | ✗ | ✗ |
| Ferramentas diagnóstico | ✓ | ✓ | ✗ |
| Auth real obrigatório | ✗ | ✓ | ✓ |
| Auth profile obrigatório | ✗ | ✓ | ✓ |
| Audit edge_function | opcional | ✓ | ✓ |
| Release review | ✗ | ✗ | ✓ |
| Confirmação ações sensíveis | ✓ | ✓ | ✓ |

## Segregação Supabase

**Staging e production devem usar projetos Supabase separados.**

O código **nunca**:

- reutiliza automaticamente env de staging em produção;
- imprime URL ou anon key;
- infere projeto pelo nome;
- carrega `service_role` no frontend.

URLs e anon keys são configuradas **separadamente** em cada ambiente de deploy (ex.: Vercel).

## Integração Headquarters

- **`EnvironmentStatusWidget`** — ambiente, release channel, mocks, Supabase configurado (sim/não), alertas
- **`useEnvironmentStatus`** — hook que resolve config + validação
- **Demo data** — `resolveDemoDataModeFromEnvironment()` substitui `NODE_ENV` inline
- **Mock role** — `@douglas/security` consulta `@douglas/environment` quando `NEXT_PUBLIC_DOS_ENVIRONMENT` está definido

## Production Safety Gate

7 checks adicionais (Sprint 5.39):

- `platform_environment_declared`
- `platform_environment_mocks_disabled`
- `platform_environment_mock_role_locked`
- `platform_environment_auth_profile_required`
- `platform_environment_edge_function_required`
- `platform_environment_incompatible` (blocking)
- `platform_environment_dev_not_production_ready` (development → max `ready_for_staging`)

## Release Readiness

Checks estáticos adicionados:

- `dos_environment_documented`
- `dos_environment_policies_present`
- `dos_environment_production_no_mocks`

## Relação com outros modelos

| Camada | Modelo | Resolução |
|--------|--------|-----------|
| `@douglas/environment` | `development/staging/production` | `NEXT_PUBLIC_DOS_ENVIRONMENT` |
| `@douglas/core` | Mesmos nomes | Constructor / facade |
| `@douglas/supabase` | `local/preview/production` | `VERCEL_ENV` + `NODE_ENV` |

`SupabaseEnvironment` permanece para infra Vercel; `PlatformEnvironment` governa políticas operacionais.

## Referências

- `docs/operations/staging-production-environments.md`
- `docs/operations/production-safety-gate.md`
- `packages/environment/src/EnvironmentProfile.ts`
