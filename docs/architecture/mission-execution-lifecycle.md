# Mission Execution Lifecycle

Sprint 5.48 — fluxo determinístico de execução de missões na Douglas AI Platform.

## Visão geral

```
Operador → Request → Created → Validated → Planned → Assigned → Running → Completed/Failed/Cancelled
                ↓         ↓          ↓         ↓         ↓          ↓
           Event Bus   Audit    Timeline   Board sync   Progress
```

O `MissionExecutionCoordinator` orquestra o ciclo completo sem conectar serviços externos de IA.

## Estados de execução

| Status | Descrição |
|--------|-----------|
| `created` | Execução registrada |
| `validated` | Missão validada |
| `planned` | Plano construído |
| `assigned` | Agente atribuído |
| `running` | Passos em execução |
| `completed` | Sucesso |
| `failed` | Falha controlada |
| `cancelled` | Cancelada pelo operador |

## Mapeamento para Mission Board

| Execução | Board (`MissionStatus`) |
|----------|-------------------------|
| created, validated, planned | `planned` |
| assigned, running | `active` |
| failed, cancelled | `blocked` |
| completed | `completed` |

Estados legados (`planned`, `active`, `blocked`, `completed`) permanecem no contrato público do `@douglas/missions`.

## Identidade e correlação

Cada execução possui:

- `missionId`, `executionId`, `correlationId`, `requestId`
- `createdBy` (abreviado), `assignedAgentId`
- timestamps, `currentStep`, `progress`, `resultSummary`, `sanitizedError`

Payloads de eventos e audit **não** expõem tokens, keys, e-mail ou UID completo.

## Idempotência

- `MissionExecutionRegistry` — estado em memória por `executionId`
- `MissionExecutionIdempotencyGuard` — política de duplicidade
- Mesmo `executionId` não reexecuta após conclusão (retorna resultado anterior)
- Missão em `running` rejeita nova execução (`mission:duplicate_rejected`)
- Retry explícito (`isRetry: true`) gera nova tentativa com `attempt` incrementado

## Event Bus

Tópicos tipados em `DouglasEventMap`:

- `mission:created`, `mission:validated`, `mission:planned`, `mission:assigned`
- `mission:started`, `mission:progress`, `mission:completed`, `mission:failed`
- `mission:cancelled`, `mission:duplicate_rejected`

Payload mínimo: `MissionLifecycleEventPayload`. Eventos emitidos pelo coordinator incluem `audited: true` para evitar loop com `AuditEventMapper`.

## Auditoria

O coordinator registra audit direto via `appendAudit`. Eventos com `audited: true` são ignorados pelo mapper. Resumos limitados a 240 caracteres — sem persistir resultado completo.

## Persistência

Contrato: `MissionExecutionPersistenceAdapter`

Implementações atuais:

- `InMemoryMissionExecutionPersistence`
- `SessionMissionExecutionPersistence` (sessionStorage)
- `CompositeMissionExecutionPersistence`

**Limitação:** sem migration Supabase nesta sprint. O contrato prepara persistência futura remota.

## Missão demonstrativa

Tipo: `operational_diagnostic`  
Título: *Executar diagnóstico operacional da Douglas AI OS*  
Agente: `agent:platform-diagnostics`  
Executor determinístico — 4 passos simulados, sem IA externa.

## Adicionar novos tipos de missão

1. Implementar `IMissionStepExecutor` com `missionType` único
2. Registrar em `MissionExecutorRegistry`
3. Estender RBAC em `MissionExecutionAccessPolicy` se necessário
4. Adicionar testes de fluxo e idempotência
5. (Futuro) persistência Supabase via adapter dedicado

## Componentes

| Módulo | Responsabilidade |
|--------|------------------|
| `MissionExecutionCoordinator` | Orquestração |
| `MissionExecutionIdempotencyGuard` | Duplicidade |
| `DiagnosticMissionExecutor` | Demo determinística |
| `MissionExecutionWidget` | UI Headquarters |
| `MissionExecutionIntegration` | Provider + Event Bus |
