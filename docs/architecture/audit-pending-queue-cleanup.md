# Audit Pending Queue Cleanup

Sprint **5.32** adiciona limpeza segura e controlada da fila local de pendências de audit, sem afetar o log principal nem registros remotos.

## Audit log vs pending queue

| Storage | Chave | Conteúdo | Limpeza 5.32 |
|---------|-------|----------|--------------|
| Audit log principal | `douglas-ai-os:operational-audit` | Entradas operacionais completas (fallback oficial) | **Nunca** |
| Pending queue | `douglas-ai-os:audit-pending-queue` | Cópias aguardando sync remoto | **Somente aqui** |
| Supabase | `operational_audit_entries` | Persistência remota | **Nunca** (via UI) |

A pending queue é um índice de retry — não substitui o audit log local.

## Por que pendências antigas existem

Durante o período `writeMode: direct_client`, inserts eram bloqueados por RLS. Cada falha:

1. Persistia a entrada no audit log local (normal)
2. Enfileirava cópia na pending queue (Sprint 5.30)

Com `edge_function` ativo e deploy OK, novas entradas sincronizam. Pendências legadas permanecem na fila até **retry manual** ou **limpeza controlada**.

## O que pode ser limpo

| Operação | Alvo | Confirmação |
|----------|------|-------------|
| `clearResolvedPendingEntries()` | Entradas com erro legado RLS/direct_client | Sim (UI local) |
| `clearStaleFailedPendingEntries()` | Falhas persistentes + idade ≥ 7 dias | Sim (UI local) |
| `retryPendingEntries()` | Tenta sync remoto antes de descartar | Não |

### Classificação

- **resolvedLegacy** — `lastError` contém padrões RLS/permission/direct_client
- **failed** — `attemptCount ≥ 1` ou erro legado
- **staleFailed** — failed + enqueued há ≥ `staleAfterMs` (default 7 dias)
- **unattempted** — nunca retentadas

## Módulos

| Módulo | Função |
|--------|--------|
| `AuditPendingCleanupPolicy` | Limites e padrões de erro legado |
| `AuditPendingCleanupResult` | Resultado da operação |
| `AuditPendingQueueCleanup` | Stats + `clearResolved` / `clearStaleFailed` |
| `AuditPendingQueueStats` | Contagens para UI |

Integração via `CompositeAuditPersistenceAdapter` → `useAudit()`.

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Remover pendência ainda não sincronizada | Retry manual recomendado antes da limpeza |
| Confundir fila com audit log | UI explica escopo; operações só tocam pending queue |
| Limpeza acidental | Confirmação local obrigatória no widget |
| Registros remotos duplicados no retry | Edge Function deve ser idempotente (futuro) |

## Operação recomendada

1. Ativar `writeMode: edge_function` (config HQ)
2. **Retry pendências Supabase** no AuditTrailWidget
3. Revisar contadores (total, falhadas, legado)
4. **Limpar resolvidas (legado)** — falhas RLS/direct_client obsoletas
5. Após 7+ dias, **Limpar antigas/falhadas** se retry não for mais necessário

## Referências

- [audit-pending-queue-retry.md](./audit-pending-queue-retry.md)
- [audit-edge-function.md](./audit-edge-function.md)
