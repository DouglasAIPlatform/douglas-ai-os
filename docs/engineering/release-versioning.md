# Release Versioning — Douglas AI OS

Sprint 5.40 — versionamento SemVer oficial da plataforma.

## Fonte única de versão

A versão oficial vive em **`release/manifest.json`**. Todos os outros locais devem permanecer alinhados:

| Fonte | Path |
|-------|------|
| Manifesto | `release/manifest.json` |
| Monorepo root | `package.json` |
| Core | `packages/core/package.json`, `packages/core/src/Version.ts` |
| Release package | `packages/release/package.json` (manifest embutido) |
| Headquarters | `apps/headquarters/package.json`, `lib/mock-data.ts` |

O pacote `@douglas/release` importa o manifesto e exporta `OFFICIAL_PLATFORM_VERSION`. O `@douglas/core` consome essa constante — evitando defaults divergentes.

## SemVer

Formato: **MAJOR.MINOR.PATCH**

| Incremento | Quando usar |
|------------|-------------|
| **PATCH** | Correções compatíveis, ajustes internos |
| **MINOR** | Funcionalidades novas compatíveis |
| **MAJOR** | Mudanças incompatíveis de API ou arquitetura |

Exemplos válidos: `0.1.0`, `0.2.0`, `1.0.0`.

## Modelo de release

Tipos em `@douglas/release`:

- `ReleaseVersion` — parse e comparação SemVer
- `ReleaseManifest` — manifesto oficial
- `ReleaseChannel` — `development` | `staging` | `production`
- `ReleaseMetadata` — codename, datas, commit (opcional)
- `ReleaseStatus` — `draft` | `candidate` | `released` | `deprecated`
- `ReleaseChange` — categorias de changelog
- `ReleaseValidationResult` — resultado de validações

## Scripts

### `pnpm release:status` (read-only)

Exibe versão, channel, commit, working tree, último readiness cacheado e divergências.

### `pnpm release:prepare -- <versão>` (dry-run)

Por padrão **não modifica arquivos**. Valida:

1. Formato SemVer
2. Versão superior à atual
3. Working tree (bloqueia `--write` se dirty)
4. `pnpm release:check`

Com `--write`, atualiza manifest, package.json(s) e `platformVersion` no HQ.

**Nunca** cria commit, push, tag, GitHub Release ou deploy.

## Validação de consistência

`pnpm release:check` inclui checks:

- `release_manifest_present`
- `release_semver_valid`
- `release_version_consistency`
- `changelog_present`
- `changelog_current_version_entry`
- `release_workflows_present`
- `release_environment_profile_compatible`

## Headquarters

`ReleaseStatusWidget` exibe versão, ambiente, channel, readiness estático/runtime e aviso de processo manual.

## Referências

- [CHANGELOG.md](../../CHANGELOG.md)
- [Release Process](../operations/release-process.md)
- [Release Readiness Pipeline](./release-readiness-pipeline.md)
