# Release Process — Douglas AI OS

Processo operacional para preparar releases. **Release ≠ deploy ≠ ambiente.**

## Conceitos

| Termo | Significado |
|-------|-------------|
| **Release** | Versão SemVer documentada, manifest atualizado, changelog revisado |
| **Tag Git** | Marca `vX.Y.Z` apontando ao commit da release (manual) |
| **GitHub Release** | Publicação de notas na UI do GitHub (manual, opcional) |
| **Deploy** | Publicação no ambiente alvo (Vercel, Supabase, etc.) — manual |
| **Ambiente** | `development` / `staging` / `production` via `NEXT_PUBLIC_DOS_ENVIRONMENT` |

Uma release pode existir sem deploy imediato. Deploy pode ocorrer em staging antes de production.

## Fluxo recomendado

### 1. Verificar estado

```bash
pnpm release:status
pnpm release:check
pnpm test
pnpm validate
```

### 2. Dry-run da próxima versão

```bash
pnpm release:prepare -- 0.2.0
```

Revise o plano de alterações. Nenhum arquivo é modificado.

### 3. Aplicar alterações (opcional)

Somente após working tree **clean**:

```bash
pnpm release:prepare -- 0.2.0 --write
```

### 4. Atualizar CHANGELOG

Adicione seção `## [X.Y.Z] - AAAA-MM-DD` com categorias:

- Added
- Changed
- Fixed
- Security
- Deprecated
- Removed

Registre apenas o que foi implementado.

### 5. Revisão humana

- [ ] `pnpm release:check` passa
- [ ] CHANGELOG revisado
- [ ] Migrations revisadas (se houver)
- [ ] Production Safety Gate no ambiente alvo
- [ ] RBAC e RLS conferidos

### 6. Commit e tag (manual)

```bash
git add release/manifest.json CHANGELOG.md package.json packages/ apps/
git commit -m "chore: release v0.2.0"
git tag v0.2.0
git push origin main --tags
```

### 7. GitHub Release (manual, opcional)

Crie release na UI do GitHub usando as notas do CHANGELOG.

### 8. Deploy (manual)

Deploy no ambiente desejado permanece separado da release.

## Rollback conceitual

1. **Deploy rollback** — reverter para build/tag anterior no provedor (Vercel, etc.)
2. **Database** — migrations reversas ou restore de backup (fora do escopo automático)
3. **Manifest** — não reverta automaticamente; prepare nova patch release se necessário

Não existe rollback automático nesta fase.

## Checklist rápido

Ver também [release-checklist.md](./release-checklist.md) e [release-readiness-pipeline.md](../engineering/release-readiness-pipeline.md).

## CI

- `release-readiness.yml` — executa `pnpm release:check` em PR/push para `main`
- `release-metadata.yml` — valida tags `v*.*.*` contra manifest (read-only, sem secrets)
