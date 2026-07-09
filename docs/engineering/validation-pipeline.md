# Validation Pipeline — Douglas AI Platform

> Status: Foundation v1.0  
> Sprint: 5.18  
> Escopo: rotina confiável de validação técnica do monorepo.

## Objetivo

Garantir que alterações no monorepo possam ser verificadas de forma previsível **antes** de merge ou deploy — sem depender apenas do build do Next.js.

A pipeline separa três camadas:

| Camada | Comando | O que valida |
|--------|---------|--------------|
| **Typecheck** | `pnpm typecheck` | Tipos TypeScript em todos os pacotes + Headquarters |
| **Lint** | `pnpm lint` | ESLint (Headquarters) |
| **Build** | `pnpm build` | Compilação de produção (Headquarters via Next.js) |
| **Validate** | `pnpm validate` | Executa typecheck → lint → build em sequência via Turborepo |

## Comandos

### `pnpm typecheck`

Executa `tsc --noEmit` em cada workspace package que define o script `typecheck`.

- **Pacotes `@douglas/*`:** `tsc --noEmit -p tsconfig.json`
- **Headquarters:** `tsc --noEmit` (tsconfig do app)

Mais rápido que `pnpm build` — ideal durante desenvolvimento e PRs.

### `pnpm lint`

Executa ESLint via Turborepo. Atualmente apenas **Headquarters** possui configuração ESLint (`eslint.config.mjs`).

Pacotes sem script `lint` são ignorados automaticamente pelo Turborepo.

### `pnpm build`

Build de produção. Apenas **Headquarters** possui script `build` (Next.js). Pacotes `@douglas/*` exportam source TypeScript diretamente — não precisam de build próprio nesta fase.

### `pnpm validate`

Pipeline completa:

```bash
turbo run typecheck lint build
```

Use antes de abrir PR, após refactors amplos ou antes de deploy.

## Turborepo

Tasks registradas em `turbo.json`:

| Task | dependsOn | Notas |
|------|-----------|-------|
| `build` | `^build` | Outputs: `.next/**`, `dist/**` |
| `typecheck` | `^typecheck` | Sem outputs (cache por hash de entrada) |
| `lint` | `^lint` | Sem outputs |
| `validate` | `typecheck`, `lint`, `build` | Meta-task para CI futuro |

Ordem de dependência entre pacotes: Turborepo respeita `^typecheck` (dependências workspace primeiro).

## Quando usar cada comando

| Situação | Comando recomendado |
|----------|---------------------|
| Editou tipos em um pacote | `pnpm typecheck` |
| Editou componentes React no HQ | `pnpm typecheck` + `pnpm lint` |
| Antes de PR / merge | `pnpm validate` |
| Verificar deploy | `pnpm validate` |
| Iteração rápida em dev | `pnpm dev` (sem validate) |

## Como isso protege a plataforma

1. **Typecheck antecipa erros** que o build Next.js só revelaria tarde.
2. **Lint mantém consistência** de código e pega anti-patterns (hooks, empty types).
3. **Build confirma** integração real (bundling, SSR, rotas estáticas).
4. **Validate unifica** os três gates num único comando reproduzível.

## CI/CD futuro

Exemplo de job GitHub Actions:

```yaml
- name: Validate monorepo
  run: pnpm validate
```

Opcionalmente, separar jobs para feedback paralelo:

```yaml
jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: pnpm install --frozen-lockfile
      - run: pnpm lint

  build:
    needs: [typecheck]
    runs-on: ubuntu-latest
    steps:
      - run: pnpm build
```

## Estrutura de arquivos

| Arquivo | Função |
|---------|--------|
| `package.json` (root) | Scripts `typecheck`, `lint`, `validate` |
| `turbo.json` | Tasks e dependências |
| `tsconfig.package.json` | Base compartilhada para pacotes |
| `packages/*/tsconfig.json` | Config por pacote |
| `packages/*/package.json` | Script `typecheck` |
| `apps/headquarters/package.json` | `typecheck`, `lint`, `build` |

## Limitações conhecidas

| Item | Status | Sprint sugerida |
|------|--------|-----------------|
| ESLint apenas no Headquarters | Pacotes não lintados individualmente | 5.19 — Shared ESLint config |
| Warnings `react-hooks/exhaustive-deps` | Warnings não bloqueiam lint | 5.19 — Hook deps cleanup |
| Pacotes sem build dist | Source exports — OK para fase atual | Supabase / publish phase |
| Testes automatizados | Não existem ainda | 5.20 — Test pipeline |

## Referências

- [Turborepo — Pipeline](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- `docs/architecture/demo-data-control-architecture.md` — config de demo/production
