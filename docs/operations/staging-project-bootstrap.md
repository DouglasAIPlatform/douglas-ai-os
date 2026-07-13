# Staging Project Bootstrap

> Sprint 5.53 — pacote operacional para criar um ambiente staging **separado** de development e production.

## Objetivo

Preparar a Douglas AI OS para um staging real com:

- projeto Supabase próprio;
- banco, Auth e `operator_profiles` dedicados;
- Edge Function `audit-ingest` própria;
- migrations aplicadas manualmente;
- variáveis de deploy próprias;
- **nenhum dado compartilhado** automaticamente com production.

Este pacote **não cria** projeto remoto, **não aplica** migrations e **não configura** secrets.

## Manifesto seguro

`StagingTargetManifest` em `@douglas/environment`:

| Campo | Valor |
|-------|-------|
| `environment` | `staging` |
| `requireSeparateSupabaseProject` | `true` |
| `requireRealAuth` | `true` |
| `requireActiveOperatorProfile` | `true` |
| `requireEdgeAudit` | `true` |
| `requireAuditAuthModeRequired` | `true` |
| `requireRemoteMissionPersistence` | `true` |

Sem project ref, URL, anon key ou tokens no repositório.

## Status do bootstrap

| Status | Significado |
|--------|-------------|
| `not_started` | Bootstrap não iniciado |
| `configuration_prepared` | Codebase e templates prontos |
| `remote_project_pending` | Aguardando projeto Supabase staging |
| `remote_link_pending` | Aguardando `supabase link` |
| `migrations_pending` | Migrations não aplicadas |
| `edge_function_pending` | Edge Function não deployada |
| `runtime_validation_pending` | Validação runtime pendente |
| `ready` | Staging validado + revisão humana |

## Comandos

```bash
pnpm staging:bootstrap-plan   # roteiro manual read-only
pnpm staging:check            # readiness estático + runtime pendente
pnpm release:check            # inclui checks do bootstrap pack
pnpm supabase:migration-plan  # revisar migrations antes do apply
```

## Dimensões de readiness

O `StagingReadinessReport` diferencia:

- **codebasePrepared** — políticas, manifest, docs, scripts;
- **localConfigurationPrepared** — templates e env local;
- **remoteProjectConfigured** — sim / não / desconhecido;
- **runtimeValidated** — Auth, RLS, audit, persistence confirmados;
- **humanApproved** — revisão antes de production.

Checks estáticos aprovados **não** significam staging pronto.

## Referências

- [Variáveis de ambiente](./staging-environment-variables.md)
- [Checklist manual](./staging-manual-setup-checklist.md)
- [Staging bootstrap (5.47)](./staging-bootstrap.md)
- [Validation checklist](./staging-validation-checklist.md)
