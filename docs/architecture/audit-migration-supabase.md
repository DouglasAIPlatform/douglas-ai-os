# Audit Migration — Supabase

> Status: Foundation v1.2  
> Sprint: 5.22 (+ Edge Function hardening 5.27)  
> Escopo: persistência com fallback — **localStorage permanece ativo**.

## Objetivo

Preparar migração segura do Operational Audit Log de `localStorage` para Postgres (`operational_audit_entries`), sem exigir Supabase configurado e sem quebrar a UI quando a tabela ainda não existe.

## Modos de persistência (`AuditPersistenceMode`)

| Modo | Comportamento |
|------|---------------|
| `localStorage` | Apenas browser local — modo dev/offline |
| `supabase` | Grava no Postgres; fallback local em falha |
| `dual` | Dual-write: local + Supabase quando tabela OK |
| `auto` | **Padrão HQ** — `localStorage` sem env; dual-write com fallback quando Supabase configurado |

Resolução efetiva via `resolveEffectiveAuditPersistenceMode()`:

- Sem `NEXT_PUBLIC_SUPABASE_*` → sempre `localStorage`
- Com env vars → respeita modo solicitado (exceto forçar local)

Config Headquarters: `apps/headquarters/features/platform-audit/config.ts`

```typescript
export const auditPersistenceMode = "auto";
```

## Arquitetura

```
Event Bus
    │
    ▼
AuditProvider
    │
    ▼
CompositeAuditPersistenceAdapter
    ├── LocalStorageAuditPersistenceAdapter  (fallback oficial)
    └── SupabaseAuditPersistenceAdapter      (quando configurado)
            │
            ▼
    operational_audit_entries (migration 5.20)
```

### Fluxo de append

1. Sempre grava em `localStorage` (quando habilitado).
2. Se modo permite Supabase e tabela probe OK → tenta `insert` async.
3. Falha Supabase → `fallbackUsed: true`, entrada em `pendingEntries`, UI intacta.

### Fluxo de hydrate (boot)

1. Síncrono: `localStorage` → cache quente (`AuditStore`).
2. Async: probe tabela + hydrate remoto (merge prepend se houver dados).

## Status (`AuditPersistenceStatus`)

| Campo | Descrição |
|-------|-----------|
| `mode` | Modo efetivo |
| `activeAdapter` | `localStorage` \| `supabase` \| `composite` |
| `fallbackUsed` | Supabase falhou — local assumiu |
| `supabaseConfigured` | Env vars presentes |
| `supabaseTableReady` | Probe da tabela (`null` = não verificado) |
| `lastSyncAt` | Último insert Supabase bem-sucedido |
| `lastError` | Último erro de persistência remota |
| `lastRemoteStatus` | Último status Edge Function (`accepted` / `rejected` / `error`) |
| `lastRemoteErrorCode` | Código estável de erro remoto |
| `edgeFunctionNotDeployed` | Função `audit-ingest` ausente no projeto |
| `supabaseWriteMode` | `direct_client` (padrão) ou `edge_function` |
| `pendingEntries` | Fila in-memory de falhas Supabase (max 50) |

Widget: `AuditTrailWidget` exibe painel de persistência acima da tabela.

## Tabela necessária

Migration: `supabase/migrations/20250707130002_operational_audit_entries.sql`

| Coluna app | Coluna Postgres |
|------------|-----------------|
| `metadata.auditId` | `audit_id` |
| `metadata.correlationId` | `correlation_id` |
| `metadata.requestId` | `request_id` |
| `metadata.operatorId` / `actor` | `actor_id` / `actor_name` |

Mapper: `packages/audit/src/SupabaseAuditRowMapper.ts`

### RLS e writes

INSERT para `anon`/`authenticated` está **negado** na migration 5.20. Writes via browser anon key falharão com erro de permissão — o adapter trata como falha, ativa fallback local e **não quebra a UI**.

Migração definitiva exigirá Edge Function (Sprint 5.24/5.27) — resposta padronizada + JWT/CORS configuráveis — ou write server-side equivalente.

### Edge Function (Sprint 5.27)

Quando `writeMode: "edge_function"`:

- Client valida payload (`AuditIngestPayload`) antes do invoke
- Resposta padronizada parseada por `parseAuditIngestResponse()`
- Falha ou função não deployada → `fallbackUsed: true`, localStorage intacto
- `AuditTrailWidget` exibe status remoto e erros sanitizados
- **service_role permanece server-side** — nunca no app Next.js

Default Headquarters continua `direct_client` até deploy em staging.

## Fallback automático

Cenários cobertos sem crash:

| Cenário | Resultado |
|---------|-----------|
| Sem env Supabase | `localStorage` only |
| Env OK, tabela ausente | Probe falha → fallback local |
| Env OK, RLS bloqueia INSERT | append async falha → fallback local |
| Rede indisponível | Erro registrado, local continua |

## Riscos

| Risco | Mitigação atual |
|-------|-----------------|
| Dual-write parcial (local OK, remoto falha) | `pendingEntries` + `lastError` visíveis no widget |
| Divergência local vs remoto | Hydrate remoto no boot; local é source of truth em runtime |
| INSERT bloqueado por RLS | Esperado até Edge Function — fallback local |
| `pendingEntries` só in-memory | Perdido no refresh — retry manual futuro |
| localStorage ~5MB | `maxEntries: 200` mantido |

## Migração definitiva (futuro)

1. Aplicar migrations Supabase em staging/prod.
2. Implementar write path server-side (Edge Function + service role).
3. Alterar `auditPersistenceMode` para `supabase` ou manter `dual` temporariamente.
4. Script de backfill: export localStorage → batch insert via service role.
5. Validar correlação `auditId` / `correlationId` entre ActionAuditLog e Operational Audit.
6. Desabilitar dual-write quando remoto for confiável; manter local como disaster fallback opcional.

## Arquivos principais

| Arquivo | Papel |
|---------|-------|
| `packages/audit/src/AuditPersistenceMode.ts` | Modos + resolução |
| `packages/audit/src/CompositeAuditPersistenceAdapter.ts` | Orquestração + fallback |
| `packages/audit/src/AuditIngestPayload.ts` | Validação ingest |
| `packages/audit/src/AuditIngestResponse.ts` | Contrato resposta Edge Function |
| `packages/audit/src/SupabaseAuditEdgeInvoke.ts` | Invoke + parser |
| `packages/audit/src/SupabaseAuditPersistenceAdapter.ts` | Probe, append async, status |
| `apps/headquarters/features/platform-audit/AuditIntegration.tsx` | Wiring com `useSupabase()` |
| `apps/headquarters/components/widgets/AuditTrailWidget.tsx` | UI de status |

## Referências

- [Operational Audit Log](./operational-audit-log-architecture.md)
- [Audit Persistence Unification](./audit-persistence-unification-architecture.md)
- [Supabase Schema & RLS](./supabase-schema-rls.md)
- [Audit Edge Function](./audit-edge-function.md) (Sprint 5.24)
