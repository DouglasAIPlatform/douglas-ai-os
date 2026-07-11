# RBAC Catalog Drift Guard (Sprint 5.46)

Mecanismo reproduzível que detecta divergência entre catálogos RBAC em client, servidor, Edge Function e migrations SQL.

## Fonte canônica

**Arquivo:** `packages/security/rbac-catalog.json`

Contém:

- `roles` — viewer, operator, admin, owner
- `permissions` — lista completa de permissões válidas
- `ownerExclusive` — permissões reservadas ao owner
- `rolePermissions` — mapa role → permissões

Importado por:

- `packages/security/src/Permission.ts` (import JSON direto)
- `packages/security/src/rbac-catalog/RBACCatalogCanonical.ts` (loader tipado)

**Requisitos da fonte:**

- Sem dependência de React ou `node:fs`
- Sem secrets
- Importável por TypeScript client e scripts Node
- Verificável estaticamente contra Edge e SQL

## Catálogos derivados

| Destino | Arquivo | Como é mantido |
|---------|---------|----------------|
| Client | `Permission.ts` | Importa JSON canônico |
| Server | `ServerPermissionCatalog.ts` | Espelho de `ROLE_PERMISSIONS` |
| Edge (Deno) | `supabase/functions/audit-ingest/ServerPermissionCatalog.ts` | Espelho manual — verificado por drift check |
| SQL seed | `20250707130000_platform_helpers.sql` + `20250710190000_owner_permission_seed.sql` | INSERT em `operator_role_permissions` |

## Drift detector

Módulos em `packages/security/src/rbac-catalog/`:

| Módulo | Responsabilidade |
|--------|------------------|
| `RBACCatalogSnapshot` | Normaliza catálogo para comparação |
| `RBACCatalogComparison` | Diff canônico vs derivado |
| `RBACCatalogMismatch` | Tipos de divergência |
| `RBACCatalogDriftReport` | Status final (passed / passed_with_warnings / failed) |
| `RBACCatalogDriftRunner` | Orquestra comparações (client, server, Edge, SQL) |

### Comparações realizadas

1. **Edge** — parse estático de `audit-ingest/ServerPermissionCatalog.ts`
2. **SQL seed** — tuples INSERT das migrations base + owner seed
3. **Client** — `Permission.ts` importa `rbac-catalog.json`; verificado via vitest no CLI

### Falhas bloqueantes

- Permissão no client ausente no canônico (ou vice-versa)
- Permissão no Edge divergente
- Owner-exclusive atribuída a admin/operator/viewer
- Role desconhecida
- Seed SQL incompleta vs canônico

## Comando

```bash
pnpm rbac:drift-check
```

Read-only. Exit code:

- `0` — passed ou passed_with_warnings
- `1` — failed

Integrado em `pnpm release:check` como check bloqueante `rbac_catalog_drift_check`.

## Como adicionar nova permissão com segurança

1. Editar `packages/security/rbac-catalog.json` — adicionar em `permissions` e na(s) role(s) apropriada(s)
2. Se owner-exclusive, incluir em `ownerExclusive` e **somente** em `rolePermissions.owner`
3. `Permission.ts` e `ServerPermissionCatalog.ts` passam a refletir via import canônico
4. Atualizar espelho Edge: `supabase/functions/audit-ingest/ServerPermissionCatalog.ts`
5. Criar migration SQL para `operator_role_permissions` (INSERT idempotente)
6. Executar `pnpm rbac:drift-check` e `pnpm test:rbac`

## CI

`.github/workflows/release-readiness.yml` executa `pnpm release:check`, que inclui o drift check. Sem Supabase remoto e sem secrets.

## Relação com migrations e Edge

- **Migrations:** drift check parseia INSERTs de `operator_role_permissions` e compara ao JSON canônico. Não aplica migrations.
- **Edge Function:** Deno não importa o monorepo; o espelho TS é parseado estaticamente. Futuro: copiar `rbac-catalog.json` para `_shared/` se Deno passar a importá-lo.

## Limitações

- Edge continua espelho manual — drift check detecta divergência, não sincroniza automaticamente
- `Permission` union type em `SecurityTypes.ts` ainda deve ser atualizado manualmente ao adicionar permissões
- Migrations não aplicadas remotamente — drift verifica arquivos locais apenas

## Verificação

```bash
pnpm rbac:drift-check
pnpm test:rbac
pnpm release:check
```

Testes: `packages/security/src/rbac-catalog/rbac-catalog-drift.rbac.test.ts`
