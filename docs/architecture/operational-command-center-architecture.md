# Operational Command Center Architecture — Douglas AI Platform

> Status: Foundation v1.1  
> Sprint: 5.8 (+ integrações 5.9–5.12)  
> Escopo: consolidação operacional do Headquarters.

## Objetivo

Transformar o Headquarters em um **Command Center operacional**, conectando widgets existentes via estado unificado sem removê-los.

## Pacote `@douglas/command-center`

Camada pura (sem React, sem `@douglas/*`):

```
packages/command-center/src/
├── OperationalCommandCenterTypes.ts
├── OperationalStatus.ts
├── OperationalActionAvailability.ts
├── OperationalRecommendation.ts
├── OperationalCommandCenter.ts
└── index.ts
```

### Tipos principais

| Tipo | Função |
|------|--------|
| `OperationalStatus` | Status consolidado (platform + health + diagnostics) |
| `OperationalActionAvailability` | Disponibilidade de ação com gate de readiness |
| `OperationalRecommendation` | Recomendações operacionais unificadas |
| `OperationalCommandCenter` | Facade `build(input)` → snapshot |

## Integração na app

`useOperationalCommandCenter()` em `features/operational-command-center/` compõe:

- `usePlatformState()` — snapshot unificado
- `useBootDiagnostics()` — readiness report
- `useRuntimeControl()` — módulos + histórico de ações
- `useSystemHealth()` — health geral
- `useLiveEventMonitor()` — eventos críticos

## Widgets conectados

### UnifiedPlatformStatusWidget → visão principal

Exibe: status geral, readiness score, módulos prontos/alerta/crítico, health, último diagnóstico, últimas ações, eventos críticos, recomendações.

### DependencyGraphWidget → dados live

- **Live:** quando `bootstrap.isReady || runtime.isRunning`, usa `buildLiveDependencyGraphInput()` (status de nós/arestas do bootstrap + runtime).
- **Fallback:** topologia estática em `platformDependencyGraphInput` (seeds) antes do boot completar. Indicado no footer do widget.

### RuntimeControlWidget → gate de readiness + confirmação

Integrado com `BootDiagnostics` e `ActionConfirmationProvider`:

| Diagnostics | pause / resume / restart |
|-------------|--------------------------|
| `ready === true` | Regras normais do Runtime |
| `status === degraded` | Disponível com **confirmação operacional** (`ActionConfirmationModal`) |
| `status === not_ready` | **Bloqueado** (`blockedByReadiness: true`) |
| Report pendente | Confirmação necessária para ações destrutivas |

Ações seguras (`refresh_module`, `run_health_check`) não são bloqueadas pelo gate.

## Mocks que permanecem

| Componente | Mock / estático |
|------------|-----------------|
| Dependency Graph | Topologia (nós/arestas) vem de **seeds** — apenas status é live |
| Runtime actions | Simuladas — sem efeito em infra real |
| Event Monitor | Seeds/ticker demo controlados por `@douglas/demo-data` |
| Module hooks | pause/stop/restart são mocks vazios na app layer |

## Próximos passos

1. RBAC real antes de executar ações destrutivas
2. Ações inline no Command Center (sem navegar ao RuntimeControlWidget)
3. CLI `pnpm platform:status` consumindo `OperationalCommandCenter`
