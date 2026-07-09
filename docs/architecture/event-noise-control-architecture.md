# Event Noise Control — Douglas AI Platform

> Status: Foundation v1.0  
> Sprint: 5.11  
> Escopo: controle de ruído demo/real no Live Event Monitor.

## Objetivo

Melhorar a separação e filtragem de **eventos demo/mock** vs **eventos reais** do Event Bus, sem remover mocks.

## Pacote `@douglas/monitor` — novos tipos

| Tipo | Função |
|------|--------|
| `EventMonitorViewMode` | `all` · `real-only` · `demo-only` |
| `EventMonitorFilters` | viewMode + severity + source |
| `EventNoisePolicy` | `enableDemoEvents` — controla ticker mock |
| `EventDisplaySettings` | filters + displayLimit + noisePolicy |
| `buildEventDisplayResult()` | Aplica filtros client-side sobre o log completo |

## Filtros do widget

| Filtro | Valores | Efeito |
|--------|---------|--------|
| **Exibição** | Todos / Apenas reais / Apenas demo | Filtra por `event.demo` |
| **Severidade** | Todas · critical · error · warning · info · success | Filtra `event.severity` |
| **Origem** | Todas · core · runtime · … | Filtra `event.source` |

Filtros são **client-side** sobre `monitor.getLog().getAll()` — não alteram o log, apenas a exibição.

## Marcação visual demo

Eventos com `demo: true`:

- Linha com `opacity-60`
- Mensagem em itálico
- Badge **Demo** com tooltip explicativo
- Origem: seeds iniciais + ticker mock

Eventos reais (`demo: false`) vêm do Event Bus bridge.

## Desligar eventos demo

Controle central via `@douglas/demo-data` — ver [demo-data-control-architecture.md](./demo-data-control-architecture.md).

Com `enableDemoEvents: false` (modo `production` ou `manual`):

- Seeds **não** são carregados (`seedEvents={[]}`)
- Ticker mock **não** inicia
- Apenas eventos reais do Event Bus entram no log

Config legada `eventMonitorNoisePolicy` deriva de `demoDataConfig` para compatibilidade.

## Arquivos

| Arquivo | Alteração |
|---------|-----------|
| `packages/monitor/src/EventMonitor*.ts` | Filtros, policy, display |
| `features/platform-monitor/config.ts` | Policy local |
| `features/platform-monitor/EventMonitorIntegration.tsx` | Ticker condicional |
| `components/widgets/LiveEventMonitorWidget.tsx` | UI de filtros + badge demo |

## Próximos passos

1. ~~Persistir preferência de filtros (localStorage)~~ — implementado (Sprint 5.15)
2. ~~Desligar seeds quando `enableDemoEvents: false`~~ — implementado (Sprint 5.15)
3. Auto-modo "real-only" quando volume real > N eventos/min
