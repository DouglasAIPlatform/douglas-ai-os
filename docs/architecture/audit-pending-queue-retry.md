# Audit Pending Queue & Retry

Sprint **5.30** introduz uma fila persistente de entradas de audit que falharam ao ser enviadas ao Supabase (cliente direto ou Edge Function). O objetivo é melhorar a confiabilidade da auditoria sem remover o fallback oficial em `localStorage`.

## Visão geral

```
Event Bus → AuditLog.record()
                │
                ▼
     CompositeAuditPersistenceAdapter
                │
     ┌──────────┴──────────┐
     ▼                     ▼
localStorage          Supabase / Edge
(douglas-ai-os:       (quando configurado)
 operational-audit)
     │                     │
     │              falha remota
     │                     │
     └──────────┬──────────┘
                ▼
   LocalStorageAuditPendingQueue
   (douglas-ai-os:audit-pending-queue)
                │
                ▼
        retryPendingEntries()  ← manual (HQ widget)
```

## Quando uma entrada vira pending

Uma entrada entra na fila quando **todas** as condições abaixo são verdadeiras:

1. O modo efetivo permite escrita Supabase (`auto` ou `supabase` com cliente configurado).
2. A tabela remota foi considerada disponível no momento do `append` (probe OK).
3. A persistência remota falha (`appendAsync` retorna `success: false`).

Nesse caso:

- A entrada **permanece** no log principal em `localStorage` (`douglas-ai-os:operational-audit`) — comportamento inalterado.
- Uma cópia estruturada é adicionada à fila `douglas-ai-os:audit-pending-queue`.
- São preservados `auditId`, `requestId` e `correlationId` (do resultado remoto ou dos metadados da entrada).

**Não** entram na fila:

- Ambientes sem Supabase configurado (nenhuma tentativa remota).
- Falhas de probe inicial quando a tabela já é conhecida como indisponível (sem tentativa de append remoto).

## Componentes

| Módulo | Responsabilidade |
|--------|------------------|
| `AuditPendingEntry` | Shape da entrada na fila + helpers de IDs |
| `AuditPendingQueue` | Contrato da fila |
| `LocalStorageAuditPendingQueue` | Persistência local da fila (chave separada) |
| `AuditRetryPolicy` | Limites (`maxEntries: 50`, `manualOnly: true`) |
| `AuditRetryStatus` | Estado de sync (`idle`, `pending`, `retrying`, `synced`, `failed`) |
| `AuditSyncResult` | Resultado do retry manual |
| `AuditSyncManager` | Orquestra `retryPendingEntries()` via adapter Supabase |
| `CompositeAuditPersistenceAdapter` | Enfileira em falha remota; expõe retry e status |

## Retry manual

```typescript
const result = await adapter.retryPendingEntries();
// ou via React:
const { retryPendingEntries } = useAudit();
await retryPendingEntries?.();
```

Comportamento:

- **Supabase não configurado:** retorna imediatamente com `skipped: true` — nada é enviado remotamente.
- **Com Supabase:** percorre a fila em ordem, tenta `appendAsync` para cada entrada.
- Sucesso → remove da fila.
- Falha → incrementa `attemptCount`, atualiza `lastError` e mantém na fila.
- Não há background sync agressivo nesta sprint (`AuditRetryPolicy.manualOnly: true`).

O **AuditTrailWidget** exibe contagem de pendências, último retry, último erro de retry, status de sincronização e botão **Retry pendências Supabase**.

## Integração futura com Edge Function

Quando `writeMode: edge_function` estiver ativo e a função `audit-ingest` for deployada:

1. Falhas de invoke continuam enfileirando entradas com IDs de correlação.
2. `retryPendingEntries()` reutiliza o mesmo `SupabaseAuditPersistenceAdapter.appendAsync`, que já roteia para Edge ou client conforme config.
3. Um sync em background (futuro) pode chamar o mesmo `AuditSyncManager` respeitando `maxAttemptsPerEntry` e backoff — fora do escopo desta sprint.

## Segurança

- Erros exibidos na UI passam por `sanitizeAuditErrorForDisplay`.
- Sem Supabase configurado, nenhuma chamada remota é feita no retry.
- A fila armazena o mesmo `AuditEntry` já presente no log local — não adiciona campos sensíveis novos.
- `service_role` continua proibido no frontend.

## Riscos e limites do localStorage

| Limite | Impacto |
|--------|---------|
| Capacidade (~5 MB por origem) | Fila limitada a 50 entradas; log principal limitado a 200 |
| Por aba/navegador | Fila não sincroniza entre dispositivos ou perfis |
| Limpeza manual do usuário | Perda da fila e do log local |
| Modo privado | Persistência pode ser efêmera |
| Quota exceeded | `pendingQueueError` reflete falha de escrita |

A fila é um **complemento** ao fallback local, não substituto de persistência remota durável.

## Chaves de storage

| Chave | Conteúdo |
|-------|----------|
| `douglas-ai-os:operational-audit` | Log operacional completo (fallback oficial) |
| `douglas-ai-os:audit-pending-queue` | Entradas aguardando sync remoto |

## Referências

- [audit-edge-function.md](./audit-edge-function.md)
- [audit-migration-supabase.md](./audit-migration-supabase.md)
- [audit-persistence-unification-architecture.md](./audit-persistence-unification-architecture.md)
