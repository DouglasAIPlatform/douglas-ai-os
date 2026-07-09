# Operational Audit Log — Douglas AI Platform

> Status: Foundation v1.0  
> Sprint: 5.13  
> Escopo: auditoria operacional in-memory via Event Bus.

## Objetivo

Centralizar registro de ações importantes da plataforma sem duplicar lógica dos módulos — o Audit Log **consome** eventos já publicados.

## Arquitetura

```
Event Bus (security · runtime · diagnostics)
        │
        ▼ subscribeAll()
AuditProvider / AuditEventMapper
        │
        ▼ record()
AuditLog → AuditStore (in-memory, cap 200)
        │
        ▼ useAudit()
AuditTrailWidget
```

## Pacote `@douglas/audit`

| Tipo | Função |
|------|--------|
| `AuditEntry` | Entrada normalizada (id, timestamp, actor, role, source, action, target, severity, message, metadata) |
| `AuditStore` | Armazenamento in-memory + subscribe |
| `AuditLog` | API de gravação/consulta |
| `AuditPersistenceAdapter` | Interface para persistência futura |
| `AuditEventMapper` | Mapeia `Event` → `AuditEntry[]` |
| `AuditProvider` | Consome Event Bus e alimenta o log |
| `AuditContext` / `useAudit()` | Acesso React |

## Eventos auditados

| Event Bus | AuditAction | Severidade típica |
|-----------|-------------|-------------------|
| `security:action:allowed` | `action_allowed` | info |
| `security:action:blocked` | `action_blocked` | warning |
| `security:action:confirmed` | `action_confirmed` | info |
| `security:action:cancelled` | `action_cancelled` | info |
| `runtime:action:started` | `runtime_action_started` | info |
| `runtime:action:completed` | `runtime_action_completed` | info |
| `runtime:action:failed` | `runtime_action_failed` | error |
| `diagnostics:report:completed` (not_ready) | `diagnostics_critical_issue` | critical |
| `diagnostics:report:failed` | `diagnostics_critical_issue` | critical |
| `diagnostics:report:completed` (status/ready mudou) | `readiness_status_changed` | info–critical |

**Não auditado:** `security:action:confirmation_requested` (apenas abertura de modal).

## Campos de `AuditEntry`

| Campo | Origem |
|-------|--------|
| `actor` | `operatorId` (security) ou `runtime` / `diagnostics` / `platform-state` |
| `role` | `operatorRole` ou `system` |
| `target` | `moduleId` ou `platform` |
| `metadata` | `eventId`, `topic`, payload relevante |

## Relação com `ActionAuditLog` (`@douglas/security`)

O `ActionAuditLog` continua registrando ações de segurança no Security Layer (contrato preservado). O Operational Audit Log é uma **visão unificada cross-domain** alimentada pelo Event Bus.

## Persistência futura

Implementar `AuditPersistenceAdapter`:

```typescript
const auditLog = createAuditLog({
  persistence: {
    async append(entry) {
      await supabase.from("audit_entries").insert(entry);
    },
    async query(limit) {
      return supabase.from("audit_entries").select().limit(limit);
    },
  },
});
```

Passar ao `AuditProvider` via prop `auditLog` ou `logOptions.persistence`. O `AuditStore` in-memory permanece como cache quente; o adapter grava de forma assíncrona.

## Integração Headquarters

```
RuntimeIntegration
  └── SecurityIntegration
        └── AuditIntegration (AuditProvider)
              └── HealthIntegration → widgets
```

Widget: `AuditTrailWidget` na página `/headquarters`.

## Arquivos

| Arquivo | Alteração |
|---------|-----------|
| `packages/audit/src/*` | Pacote novo |
| `features/platform-audit/AuditIntegration.tsx` | Wiring |
| `components/widgets/AuditTrailWidget.tsx` | UI |
| `features/platform-runtime/RuntimeIntegration.tsx` | Provider tree |
