# Changelog

Todas as mudanças notáveis da Douglas AI OS são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/) (estrutura inspirada, conteúdo próprio).
Versionamento conforme [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Sistema oficial de versionamento SemVer com `release/manifest.json` como fonte única.
- Scripts `pnpm release:status` e `pnpm release:prepare` (dry-run por padrão).
- Widget `ReleaseStatusWidget` no Headquarters.
- Documentação de versionamento e processo de release.

## [0.1.0] - 2026-07-10

Checkpoint inicial consolidando marcos já implementados na plataforma.

### Added

- Monorepo Douglas AI OS com Headquarters (Next.js), pacotes `@douglas/*` e pipeline `pnpm validate`.
- `@douglas/core` — engine, módulos, event bus, health check e configuração de ambiente.
- Headquarters — dashboard operacional com widgets desacoplados (runtime, health, audit, Supabase, auth).
- Integração Supabase — conexão, validação, schema com migrations iniciais e RLS.
- Edge Function `audit-ingest` com persistência remota de audit trail.
- Production Safety Gate — avaliação read-only de readiness para staging/produção.
- Release Readiness Pipeline (`pnpm release:check`) com checks bloqueantes e documentação operacional.
- Suíte RBAC (`pnpm test:rbac`) — matriz de permissões e casos de verificação programática.
- `@douglas/environment` — separação development/staging/production com políticas de mocks e release channel.
- `EnvironmentStatusWidget` e documentação de ambientes (`NEXT_PUBLIC_DOS_ENVIRONMENT`).
- Operator profile bootstrap, auth handoff e bridge operador/autenticação.
- Documentação de arquitetura, operações e segurança em `docs/`.

### Security

- Políticas de ambiente que bloqueiam mocks e mock role em production.
- Scan de secrets versionados no pipeline de release readiness.
- Verificação RBAC com roles admin, operator, viewer e owner (owner ≡ admin).

### Changed

- Audit writeMode configurado como `edge_function` no Headquarters para releases.

[Unreleased]: https://github.com/douglas-ai/douglas-ai-os/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/douglas-ai/douglas-ai-os/releases/tag/v0.1.0
