# Demo Data Control — Douglas AI Platform

> Status: Foundation v1.1  
> Sprint: 5.15 + 5.17  
> Escopo: controle previsível de dados demo vs reais.

## O que é demo vs real

| Tipo | Origem | Identificação |
|------|--------|---------------|
| **Demo** | Seeds, ticker mock, mocks de widgets/brain/memory | `LiveEvent.demo === true`, fontes `DemoDataSource` |
| **Real** | Event Bus (runtime, security, diagnostics, etc.) | `LiveEvent.demo === false` via `mapBusEventToLiveEvent` |

Mocks **não são removidos** do projeto — apenas controlados por política.

## Pacote `@douglas/demo-data`

| Tipo | Função |
|------|--------|
| `DemoDataConfig` | Modo + overrides manuais |
| `DemoDataPolicy` | Política resolvida (flags efetivas) |
| `DemoDataSource` | Origens controláveis |
| `DemoDataProvider` | Contexto React |
| `resolveDemoDataPolicy()` | development / production / manual |
| `isDemoSourceEnabled()` | Gate por origem |
| `toEventNoisePolicy()` | Bridge para `@douglas/monitor` |
| `DEMO_DATA_UNCONNECTED_*` | Copy padrão de empty state |

## Fontes demo padronizadas (Sprint 5.17)

| Fonte | Escopo | Flag efetiva |
|-------|--------|--------------|
| `event_monitor_seeds` | Seeds iniciais do monitor | `enableDemoEvents` + `enableDemoSeeds` |
| `event_monitor_ticker` | Ticker mock | `enableDemoEvents` + `enableDemoTicker` |
| `event_monitor_events` | Qualquer evento demo | seeds ou ticker |
| `brain_mocks` | 8 domínios Brain (providers) | `enableDemoWidgets` |
| `memory_mocks` | Seeds `@douglas/memory` | `enableDemoWidgets` |
| `bootstrap_mocks` | Departments, analytics, notifications | `enableDemoWidgets` |
| `mission_mocks` | Mission Control seeds | `enableDemoWidgets` |
| `graph_mocks` | Fallback estático do Dependency Graph | `enableDemoWidgets` |
| `widget_mocks` | Search, command palette, `lib/mock-data` | `enableDemoWidgets` |

## Modos

| Modo | Padrão | Comportamento |
|------|--------|---------------|
| `development` | `NODE_ENV !== "production"` | Seeds, ticker e widgets mock **ligados** |
| `production` | `NODE_ENV === "production"` | Tudo demo **desligado** |
| `manual` | Config explícita | Flags `enableDemoEvents`, `enableDemoWidgets`, etc. |

Config Headquarters: `features/platform-demo-data/config.ts`

## Desligar demo totalmente

```typescript
// features/platform-demo-data/config.ts
export const demoDataConfig: DemoDataConfig = {
  mode: "manual",
  enableDemoEvents: false,
  enableDemoWidgets: false,
};
```

## Ligar demo para demonstrações

```typescript
export const demoDataConfig: DemoDataConfig = {
  mode: "development", // ou manual com flags true
};
```

## Preferência de exibição (localStorage)

Chave: `douglas-ai-os:live-event-monitor-view-mode`

Controles no `LiveEventMonitorWidget` — persistem independentemente da política de ingestão.

## Provider tree

```
EventProvider
  └── DemoDataProvider
        ├── EventMonitorIntegration (seeds/ticker condicionais)
        ├── DemoAwareMemoryProvider (memory_mocks)
        ├── BrainProvider (brain_mocks via useBrainMockState)
        ├── SearchProvider (widget_mocks)
        └── CommandPaletteProvider (widget_mocks)
```

`BootstrapProvider` resolve política estaticamente via `isHeadquartersDemoSourceEnabled()` em `modules.ts`.

## Mocks controlados vs pendentes

### Controlados por DemoDataProvider

| Área | Arquivo(s) | Fonte |
|------|------------|-------|
| Event Monitor | `EventMonitorIntegration.tsx` | `event_monitor_*` |
| Brain (8 domínios) | `features/brain/*Provider.tsx` | `brain_mocks` |
| Memory engine | `DemoAwareMemoryProvider.tsx` | `memory_mocks` |
| Bootstrap seeds | `platform-bootstrap/modules.ts` | `bootstrap_mocks`, `mission_mocks` |
| Dependency Graph fallback | `DependencyGraphWidget.tsx` | `graph_mocks` |
| Search index | `SearchIndex.ts`, `SearchProvider.tsx` | `widget_mocks` |
| Command palette | `registry.tsx`, `CommandPaletteProvider.tsx` | `widget_mocks` |
| Brain overview empty | `BrainOverview.tsx` | `brain_mocks` |

### Hooks utilitários (Headquarters)

| Hook | Uso |
|------|-----|
| `useDemoData()` | Gate genérico por `DemoDataSource` |
| `useDemoMockData(source, data)` | Retorna mock ou `[]` |
| `useWidgetMockCatalog()` | Projetos, agentes, stats de `lib/mock-data` |
| `useBrainMockState(data)` | Atalho para `brain_mocks` |
| `isHeadquartersDemoSourceEnabled()` | Contextos não-React (bootstrap) |

### Pendentes (intencional)

| Mock | Motivo |
|------|--------|
| `platformVersion`, `userName` em layout/header | Metadados estáticos de UI, não dados operacionais |
| Mock operators (security) | Operador simulado — fora do escopo demo data |
| Agent/workflow/automation definitions | Definições de produto reais, não seeds demo |
| Widgets prop-based não montados em rotas | `ProjectsWidget`, `AgentsWidget`, etc. — usar `useWidgetMockCatalog()` quando integrados |

## Empty states

Quando demo desligado, componentes exibem:

- **Título:** `Sem dados reais conectados`
- **Descrição:** orientação para ativar demo ou conectar Supabase

Constantes: `DEMO_DATA_UNCONNECTED_TITLE`, `DEMO_DATA_UNCONNECTED_DESCRIPTION` em `@douglas/demo-data`.

## Produção e demos futuras

- **Produção:** `mode: "production"` no build — log limpo, widgets vazios, brain vazio
- **Demos comerciais:** `mode: "development"` ou `manual` com flags on
- **Staging realista:** `manual` + todas flags off

## Arquivos (Sprint 5.17)

| Arquivo | Alteração |
|---------|-----------|
| `packages/demo-data/src/DemoDataSource.ts` | Fontes padronizadas |
| `packages/demo-data/src/demoEmptyState.ts` | Copy de empty state |
| `features/platform-demo-data/*` | Hooks, memory wrapper, static resolver |
| `features/brain/*` | Gate brain_mocks |
| `platform-bootstrap/modules.ts` | Gate bootstrap/mission |
| `DependencyGraphWidget.tsx` | Gate graph_mocks |
| `SearchIndex/Provider/Panel` | Gate widget_mocks |
| `command-palette/registry.tsx` | Gate widget_mocks |
