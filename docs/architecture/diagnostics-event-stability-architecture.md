# Diagnostics & Event Stability — Douglas AI Platform

> Status: Foundation v1.0  
> Sprint: 5.10  
> Escopo: estabilidade operacional entre Diagnostics, PlatformState e EventMonitor.

## Problema

Antes da Sprint 5.10:

- Readiness calculado em **dois lugares** (PlatformStateFacade + BootDiagnostics)
- `diagnostics:report:completed` publicado a cada 15s mesmo sem mudança
- EventMonitor misturava seeds/ticker mock com eventos reais do Event Bus
- Score podia cair bruscamente para 0 com múltiplos warnings

## 1. Fonte oficial de readiness

**Regra:** Boot Diagnostics é a fonte preferencial quando disponível.

```
PlatformOperationalIntegration
├── build fallback (platform-fallback)
├── BootDiagnostics.generate()
└── PlatformStateFacade.build({ diagnosticsReadiness })
```

| Condição | Fonte | Campo `readiness.source` |
|----------|-------|---------------------------|
| `diagnosticsReport` disponível | Boot Diagnostics | `boot-diagnostics` |
| Diagnostics indisponível | Cálculo interno do facade | `platform-fallback` |

O facade usa `diagnosticsReadiness.score`, `status` e `ready` quando presente. Blockers operacionais (bootstrap booting, DOS, etc.) continuam sendo calculados internamente.

Boot Diagnostics **não** usa mais o score do PlatformState como baseline — evita dependência circular. Baseline fixo: `READINESS_SCORE_POLICY.BASE_SCORE = 100`.

## 2. Política de emissão de eventos diagnostics

`shouldPublishDiagnosticsCompleted()` publica `diagnostics:report:started` + `completed` **somente** quando:

- Primeiro report da sessão
- Mudança de `status` (`ready` / `degraded` / `not_ready`)
- Mudança de score ≥ 5 pontos (`SCORE_CHANGE_THRESHOLD`)
- Novo critical issue (fingerprint `source:message`)
- Recuperação de critical issue (issue removido)

Ciclos silenciosos atualizam o report in-memory e widgets, **sem** eventos no bus.

## 3. Eventos reais vs demo

| Origem | `demo` | Exemplo |
|--------|--------|---------|
| Seeds iniciais | `true` | 12 eventos de boot simulado |
| Ticker 8s | `true` | heartbeat, uptime tick |
| Event Bus bridge | `false` | runtime, diagnostics, security |

`EventFilterCriteria.excludeDemo` permite filtrar demos futuramente.

Diagnostics usa **apenas eventos não-demo** na avaliação do Event Monitor check.

## 4. Regra de score (ReadinessScorePolicy)

| Parâmetro | Valor | Efeito |
|-----------|-------|--------|
| `BASE_SCORE` | 100 | Ponto de partida |
| `MAX_WARNING_PENALTY` | 15 | Cap de penalidade por warnings |
| `MAX_PENALTY_WITHOUT_CRITICAL` | 60 | Floor mínimo 40 sem críticos |
| Críticos presentes | — | Floor pode ir a 0 |

Penalidades por check permanecem; aplicação passa por `stabilizeReadinessScore()` antes do score final.

## Arquivos principais

| Pacote / App | Arquivo |
|--------------|---------|
| `@douglas/diagnostics` | `ReadinessScorePolicy.ts`, `DiagnosticsEventPolicy.ts` |
| `@douglas/platform-state` | `PlatformStateFacade.ts` — `diagnosticsReadiness` override |
| `@douglas/monitor` | `MonitorTypes.ts` — `demo`, `excludeDemo` |
| Headquarters | `PlatformOperationalIntegration.tsx` |
| Headquarters | `platform-monitor/seeds.ts` — `demo: true` |

## Próximos passos

1. Toggle UI "Ocultar demo" no LiveEventMonitorWidget
2. Desligar ticker mock quando volume real for suficiente
3. Persistir último report publicado entre reloads (opcional)
4. Unificar `readiness.level` mapping diagnostics ↔ platform labels
