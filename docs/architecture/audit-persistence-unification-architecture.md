# Audit Persistence & Unification — Douglas AI Platform

> Status: Foundation v1.0  
> Sprint: 5.14  
> Escopo: localStorage + correlação ActionAuditLog ↔ Operational Audit Log.

## Relação entre os dois logs

| | ActionAuditLog (`@douglas/security`) | Operational Audit Log (`@douglas/audit`) |
|---|--------------------------------------|------------------------------------------|
| **Escopo** | Ações de segurança (local ao Security Layer) | Cross-domain via Event Bus |
| **Fonte** | `SecurityLayer.record*()` direto | `subscribeAll()` + `AuditEventMapper` |
| **Correlação** | `entry.id` → `auditId` no evento | `metadata.auditId` na entrada operacional |
| **Fluxo confirmação** | `requestId` / `correlationId` em todas as entradas do fluxo | Mesmos IDs via payload + `event.metadata.correlationId` |

### Fluxo unificado (ação sensível)

```
1. confirmation_requested  → ActionAuditLog (outcome: requested, auditId)
                           → Event Bus (auditId, requestId, correlationId=requestId)
                           → Operational Audit (action_confirmation_requested)

2. confirmed / cancelled   → ActionAuditLog (auditId, requestId, correlationId)
                           → Event Bus
                           → Operational Audit

3. allowed                 → ActionAuditLog (correlationId do passo 1)
                           → Event Bus
                           → Operational Audit
```

`operatorName` é publicado no payload para exibição amigável no widget.

## Persistência localStorage

| Tipo | Função |
|------|--------|
| `AuditPersistenceConfig` | `enabled`, `storageKey`, `maxEntries` |
| `AuditPersistenceStatus` | contagem, timestamps, erros |
| `LocalStorageAuditPersistenceAdapter` | hydrate + append |

Config Headquarters: `features/platform-audit/config.ts`

Chave padrão: `douglas-ai-os:operational-audit`

## Migrar para Supabase

Ver documentação completa: [audit-migration-supabase.md](./audit-migration-supabase.md) (Sprint 5.22).

Resumo:

1. `CompositeAuditPersistenceAdapter` orquestra local + Supabase com fallback
2. Modo `auto` em `features/platform-audit/config.ts` (padrão Headquarters)
3. Tabela `operational_audit_entries` (migration 5.20)
4. `AuditStore` permanece cache quente; localStorage é fallback oficial

## Riscos restantes

- localStorage limitado (~5MB), sem sync multi-tab garantido
- Entradas novas antes da persistência podem não ter badge `local` até append completar
- `readiness_status_changed` ainda depende de estado em memória no mapper
- Runtime events não carregam `operatorName` — ator exibido como "Runtime Engine"
- Dois logs ainda existem; unificação é por correlação, não merge físico
