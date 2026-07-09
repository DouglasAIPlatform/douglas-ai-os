# System Health Engine Architecture — Douglas AI Platform

> Status: Foundation v1.0  
> Sprint: 5.2  
> Escopo: health engine em `packages/health/` + integração Headquarters.

## Objetivo

Criar o **System Health Engine** da Douglas AI OS — responsável por **avaliar continuamente** o estado de saúde dos módulos da plataforma após Bootstrap (5.0) e Runtime (5.1).

Sprint 5.2 é **monitoramento puro**: sem banco, sem APIs externas, mocks onde necessário.

## Pacote

```
packages/health/src/
├── HealthTypes.ts           # Status, issues, recommendations, report
├── HealthIssue.ts           # Factory + filtros de issues
├── HealthRecommendation.ts  # Factory + ordenação
├── HealthStatus.ts          # Agregação de status por módulo
├── HealthCheck.ts           # Execução de checks individuais
├── HealthReport.ts          # HealthReportBuilder
├── HealthHistory.ts         # Histórico de reports (cap 50)
├── HealthMonitor.ts         # Polling periódico (10s)
├── HealthEngine.ts          # Orquestrador
├── HealthContext.ts         # React context
├── HealthProvider.tsx
└── useSystemHealth.ts
```

## Integração Headquarters

```
BootstrapProvider
└── CoreProvider
    └── EventProvider
        └── RuntimeIntegration
            └── RuntimeProvider
                └── HealthIntegration      ← Sprint 5.2
                    └── ... providers ...
                        └── HeadquartersPage
                            ├── SystemStatusWidget
                            ├── RuntimeDashboardWidget
                            └── HealthDashboardWidget   ← NEW
```

```
apps/headquarters/features/platform-health/
├── checks.ts              # 11 health checks (mock + bootstrap/runtime)
├── HealthIntegration.tsx  # Agrega fontes bootstrap + runtime
└── index.ts
```

## Módulos avaliados (11)

| ID | Nome | Fontes |
|----|------|--------|
| `core` | Douglas Core | Bootstrap + Runtime |
| `dos` | Douglas Operating System | Bootstrap + Runtime |
| `brain` | Douglas Brain | Bootstrap + Runtime |
| `agents` | Agent Framework | Bootstrap + Runtime |
| `missions` | Mission Control | Bootstrap + Runtime |
| `workflow` | Workflow Engine | Bootstrap + Runtime |
| `automation` | Automation Engine | Bootstrap + Runtime |
| `analytics` | Analytics Engine | Bootstrap + Runtime |
| `notifications` | Notification Center | Bootstrap + Runtime |
| `plugins` | Plugin System | Bootstrap + Runtime |
| `runtime` | Platform Runtime | Runtime state agregado |

## Resultado por módulo

```ts
interface HealthModuleResult {
  moduleId: string;
  moduleName: string;
  status: "healthy" | "warning" | "critical" | "offline";
  message: string;
  lastCheckedAt: string;
  uptimeMs: number;
  issues: HealthIssue[];
  recommendations: HealthRecommendation[];
  metadata: Record<string, string | number | boolean>;
}
```

## Status

| Status | Significado |
|--------|-------------|
| `healthy` | Módulo operacional |
| `warning` | Degradação detectada |
| `critical` | Falha ou indisponibilidade |
| `offline` | Não inicializado |

Agregação global (`PlatformHealthStatus`):

```
critical > offline (todos) > warning > healthy
```

## Fluxo de avaliação

```
1. Bootstrap ready + Runtime running
         │
         ▼
2. HealthProvider habilitado
         │
         ▼
3. HealthEngine.evaluate()
         │
         ├── HealthCheck.runAll(checks)
         │        └── para cada check:
         │               ├── executa check()
         │               ├── captura issues/recommendations
         │               └── retorna HealthModuleResult
         │
         ├── HealthReportBuilder.build()
         ├── HealthHistory.record()
         └── HealthMonitor.start()  ← tick a cada 10s
         │
         ▼
4. HealthDashboardWidget consome useSystemHealth()
```

## Health Dashboard

Widget em `/headquarters` exibe:

- **Status geral** da plataforma
- Módulos **saudáveis**
- Módulos com **alerta** (warning)
- Módulos **críticos**
- Módulos **offline**
- **Último check** (timestamp)
- Tabela por módulo: status, mensagem, issues, lastCheckedAt

## Como adicionar novos checks

### Passo 1 — Definir check

Em `apps/headquarters/features/platform-health/checks.ts`:

```ts
createLinkedCheck(
  "my-module",
  "My Module",
  "my-module",      // bootstrap id
  "my-module",      // runtime id
  sources,
  { customKey: 42 },
  "Module operating normally",
),
```

### Passo 2 — Check customizado

```ts
{
  id: "custom",
  name: "Custom Module",
  check: () => buildResult(
    "custom",
    "Custom Module",
    "healthy",
    "All checks passed",
    0,
    { version: "0.1.0" },
  ),
}
```

### Contrato `HealthCheckDefinition`

```ts
interface HealthCheckDefinition {
  id: string;
  name: string;
  check: () => HealthModuleResult | Promise<HealthModuleResult>;
}
```

### Issues e recommendations

```ts
import { createHealthIssue, createHealthRecommendation } from "@douglas/health";

createHealthIssue("workflow", "warning", "Queue backlog detected");
createHealthRecommendation("workflow", "high", "Scale workflow workers");
```

## Como o Runtime consumirá o Health Engine

O Runtime (Sprint 5.1) possui `RuntimeMonitor` com health checks internos. Futuro: **adapter** entre camadas:

```ts
// RuntimeManager — evolução futura
const healthReport = healthEngine.getLatestReport();
const runtimeModule = healthReport?.modules.find(m => m.moduleId === "workflow");

if (runtimeModule?.status === "critical") {
  await this.restartModule("workflow");
}
```

Hoje, o Health Engine **lê** estado do Runtime via `PlatformHealthSources.findRuntimeModule()` — inversão: Health observa Runtime, não o contrário.

Sequência recomendada:

| Camada | Papel |
|--------|-------|
| Bootstrap | Carrega módulos |
| Runtime | Mantém módulos vivos |
| **Health Engine** | Avalia saúde de Bootstrap + Runtime |

Integração futura no `RuntimeMonitor.tick()`:

```ts
// packages/runtime — evolução
import type { HealthReport } from "@douglas/health";

interface IRuntimeHealthBridge {
  getLatestReport(): HealthReport | null;
}
```

## Como o Headquarters exibe os dados

```tsx
// HealthDashboardWidget.tsx
const { report, isEvaluating, isMonitoring } = useSystemHealth();
```

Provider tree garante que o widget só renderiza após bootstrap + runtime:

```
HealthIntegration
  enabled={bootstrapReady && runtimeRunning}
  checks={createPlatformHealthChecks({ ...sources })}
```

Dados fluem:

```
BootstrapState ──┐
                 ├── createPlatformHealthChecks() ── HealthEngine ── HealthDashboardWidget
RuntimeState ────┘
```

## Inversão de dependência

`@douglas/health` **não importa** pacotes `@douglas/*`. Checks ficam na app.

| Camada | Responsabilidade |
|--------|------------------|
| `@douglas/health` | Engine, monitor, history, report |
| `features/platform-health/` | Checks + integração bootstrap/runtime |
| Bootstrap / Runtime | Fontes de estado observadas |

## Relação com sprints anteriores

| Sprint | Pacote | Pergunta |
|--------|--------|----------|
| 5.0 | `@douglas/bootstrap` | Módulos carregados? |
| 5.1 | `@douglas/runtime` | Módulos vivos? |
| **5.2** | `@douglas/health` | Módulos saudáveis? |

## Evolução futura

1. **Health probes reais** — substituir mocks por managers de domínio
2. **Alertas via Event Bus** — publish `system:health:check` com payload detalhado
3. **Auto-remediação** — Runtime reinicia módulos com status `critical`
4. **Persistência** — enviar `HealthHistory` para Analytics Engine
5. **Thresholds configuráveis** — warning vs critical por módulo
6. **Dashboard dedicado** — rota `/health` com histórico e trends

## Testabilidade

```ts
const engine = createHealthEngine();
engine.registerChecks([
  {
    id: "test",
    name: "Test",
    check: () => ({
      moduleId: "test",
      moduleName: "Test",
      status: "healthy",
      message: "OK",
      lastCheckedAt: new Date().toISOString(),
      uptimeMs: 1000,
      issues: [],
      recommendations: [],
      metadata: {},
    }),
  },
]);

const report = await engine.evaluate();
expect(report.status).toBe("healthy");
expect(report.healthyCount).toBe(1);
```

## Preservação da arquitetura

Sprint 5.2 **não modifica** pacotes de domínio. Apenas:

- Adiciona `@douglas/health`
- Integra `HealthIntegration` dentro de `RuntimeProvider`
- Adiciona `HealthDashboardWidget` no Headquarters

Todos os contratos anteriores permanecem intactos.
