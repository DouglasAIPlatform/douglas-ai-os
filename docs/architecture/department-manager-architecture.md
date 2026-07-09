# Department Manager Architecture — Douglas AI Platform

> Status: Foundation v0.1  
> Sprint: 4.1  
> Escopo: infraestrutura de Departamentos Inteligentes em `packages/departments/`.

## Objetivo

Criar a infraestrutura dos **Departamentos Inteligentes** — unidades organizacionais capazes de registrar agentes, receber tarefas, publicar eventos, emitir métricas e reportar saúde.

Nesta sprint **não há integração** com Agent Framework, Event Bus, Workflow, Analytics ou AppShell. A entrega é arquitetura pura baseada em **interfaces**.

## Pacote

```
packages/departments/src/
├── DepartmentTypes.ts              # Tipos, IDs, labels
├── interfaces/
│   ├── IDepartmentRegistry.ts
│   ├── IDepartmentStore.ts
│   ├── IDepartmentMetrics.ts
│   ├── IDepartmentHealthReporter.ts
│   └── IDepartmentManager.ts
├── Department.ts                   # Entidade Department
├── DepartmentRegistry.ts           # Registro de departamentos
├── InMemoryDepartmentStore.ts      # Store de agentes/tarefas/eventos/métricas
├── DepartmentContext.ts            # API por departamento
├── DepartmentMetrics.ts            # Agregação de métricas
├── DepartmentStatus.ts             # Rastreador de status
├── DefaultDepartmentHealthReporter.ts
├── DepartmentManager.ts            # Orquestrador central
├── DepartmentProvider.tsx
├── DepartmentPanel.tsx
└── index.ts
```

## Seeds (app)

```
apps/headquarters/features/departments/
├── seeds.ts    # 9 departamentos + seed mock
└── index.ts
```

Sem wiring no `AppShell` nesta sprint.

## Departamentos iniciais

| ID | Nome | Agente (seed) |
|----|------|---------------|
| `pesquisa` | Pesquisa | agent:athena |
| `desenvolvimento` | Desenvolvimento | agent:forge |
| `ux` | UX | — |
| `marketing` | Marketing | agent:hermes |
| `conteudo` | Conteúdo | agent:aurora |
| `video` | Vídeo | agent:nova |
| `financeiro` | Financeiro | agent:oracle |
| `automacoes` | Automações | agent:apollo |
| `inteligencia` | Inteligência | agent:atlas |

## Arquitetura desacoplada

```
┌─────────────────────────────────────────────────────────────┐
│  UI: DepartmentPanel                                        │
├─────────────────────────────────────────────────────────────┤
│  React: DepartmentProvider + useDepartments()               │
├─────────────────────────────────────────────────────────────┤
│  DepartmentManager (IDepartmentManager)                     │
├─────────────────────────────────────────────────────────────┤
│  DepartmentContext — API scoped por departamento            │
├─────────────────────────────────────────────────────────────┤
│  IDepartmentRegistry │ IDepartmentStore                     │
│  IDepartmentMetrics  │ IDepartmentHealthReporter            │
├─────────────────────────────────────────────────────────────┤
│  InMemory* (mock) — substituível por adapters               │
└─────────────────────────────────────────────────────────────┘
```

O pacote **não importa** `@douglas/agents`, `@douglas/events`, `@douglas/workflow` ou `@douglas/analytics`.

## Componentes

### Department

Entidade imutável que encapsula `DepartmentDefinition`:

```ts
const dept = createDepartment({
  id: "pesquisa",
  name: "Pesquisa",
  description: "...",
  status: "active",
});
```

### DepartmentRegistry

Implementa `IDepartmentRegistry`:

- `register`, `registerMany`, `get`, `getAll`, `updateStatus`
- Filtros por `status` e `tag`

### DepartmentManager

Orquestrador central via `IDepartmentManager`:

```ts
const manager = new DepartmentManager();
manager.registerDepartments(departments);

manager.registerAgent("pesquisa", "agent:athena");
manager.receiveTask("pesquisa", { title: "Indexar docs", priority: "high" });
manager.publishEvent("pesquisa", "department:task:received");
manager.emitMetric("pesquisa", "tasks_completed", "Tarefas concluídas", 42);
manager.reportHealth("pesquisa");
```

Injeção de dependências:

```ts
new DepartmentManager({
  registry: customRegistry,
  store: customStore,
  metrics: customMetrics,
  healthReporter: customHealthReporter,
});
```

### DepartmentContext

API scoped por departamento — cada departamento opera via contexto:

```ts
const ctx = manager.getContext("pesquisa");

ctx.registerAgent("agent:athena");
ctx.receiveTask({ title: "Nova pesquisa" });
ctx.publishEvent({ topic: "department:research:started" });
ctx.emitMetric({ key: "queries", label: "Consultas", value: 15 });
ctx.reportHealth();
```

### DepartmentMetrics

Implementa `IDepartmentMetrics`:

- `record` — registra métrica
- `getByDepartment` — lista métricas
- `snapshot` — snapshot com taxa de conclusão e média de tarefas por agente
- `snapshotAll` — todos os departamentos

```ts
interface DepartmentMetricsSnapshot {
  departmentId: DepartmentId;
  metrics: DepartmentMetric[];
  taskCompletionRate: number;
  averageTasksPerAgent: number;
}
```

### DepartmentStatus

Rastreador independente de status por departamento (`idle`, `active`, `busy`, `degraded`, `offline`). Complementa o status em `DepartmentDefinition` no registry.

### DefaultDepartmentHealthReporter

Implementa `IDepartmentHealthReporter`:

| Condição | Saúde |
|----------|-------|
| Sem agentes ou offline | unhealthy |
| Status degraded ou >10 tarefas pendentes | degraded |
| Demais casos | healthy |

```ts
interface DepartmentHealthReport {
  departmentId: DepartmentId;
  status: DepartmentHealthStatus;
  message: string;
  checkedAt: string;
  agentCount: number;
  taskCount: number;
  activeTasks: number;
  pendingTasks: number;
}
```

## Capacidades por departamento

| Capacidade | Método | Interface |
|------------|--------|-----------|
| Registrar agentes | `registerAgent()` | `IDepartmentStore` |
| Receber tarefas | `receiveTask()` | `IDepartmentStore` |
| Publicar eventos | `publishEvent()` | `IDepartmentStore` |
| Emitir métricas | `emitMetric()` | `IDepartmentMetrics` |
| Reportar saúde | `reportHealth()` | `IDepartmentHealthReporter` |

## Interfaces

### IDepartmentRegistry

Persistência de definições de departamentos.

### IDepartmentStore

Estado operacional: agentes, tarefas, eventos, métricas.

### IDepartmentMetrics

Cálculos e snapshots de métricas.

### IDepartmentHealthReporter

Avaliação de saúde por departamento.

### IDepartmentManager

Facade unificada — ponto de integração para DOS e app layer.

## Modelo de dados

### DepartmentTask

```ts
interface DepartmentTask {
  id: string;
  departmentId: DepartmentId;
  title: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  priority: "low" | "normal" | "high";
  createdAt: string;
  updatedAt: string;
}
```

### DepartmentEvent

```ts
interface DepartmentEvent {
  id: string;
  departmentId: DepartmentId;
  topic: string;   // ex.: department:task:completed
  payload: Record<string, ...>;
  publishedAt: string;
}
```

Topics seguem padrão `department:{entity}:{action}` — compatível com Corporate Event Bus futuro.

## Escalabilidade

### 1. Adapters substituíveis

| Interface | Default | Produção |
|-----------|---------|----------|
| `IDepartmentStore` | InMemory | Supabase / Redis |
| `IDepartmentMetrics` | In-memory calc | `@douglas/analytics` adapter |
| `IDepartmentHealthReporter` | Rule-based | DOS HealthMonitor bridge |

### 2. Novos departamentos

Adicionar entrada em `departmentDefinitions` com `DepartmentId` extensível via `(string & {})`.

### 3. Integração com Agent Framework (futuro)

```ts
// Adapter — camada app
agentManager.onActivate((agent) => {
  departmentManager.registerAgent(mapDepartment(agent.department), agent.id);
});
```

### 4. Integração com Event Bus (futuro)

```ts
departmentManager.publishEvent("pesquisa", "department:research:completed", payload);
// → bridge republica no Corporate Event Bus
```

### 5. Integração com Workflow (futuro)

Tarefas de departamento mapeiam para `WorkflowDepartment` — adapter bidirecional.

### 6. Integração com DOS (Sprint 4.0)

DOS boot → `DepartmentManager.registerDepartments()` como fase pós-módulos.

### 7. DepartmentContext por produto

Plugins (Sprint 3.9) podem obter contexto do departamento associado:

```ts
const ctx = departmentManager.getContext("video");
ctx.publishEvent({ topic: "department:video:upload:ready" });
```

## Integração futura (fora desta sprint)

1. `DepartmentProvider` no AppShell
2. Bridge agentes ↔ departamentos
3. Bridge eventos departamento → Corporate Event Bus
4. Bridge métricas → Analytics Engine
5. Dashboard por departamento na rota `/departments`
6. Workflow tasks roteadas por departamento

## Uso arquitetural (referência)

```tsx
import { DepartmentProvider, DepartmentPanel } from "@douglas/departments";
import { departmentDefinitions, departmentSeedData } from "@/features/departments";

function DepartmentsPage() {
  return (
    <DepartmentProvider
      departments={departmentDefinitions}
      seedData={departmentSeedData}
    >
      <DepartmentPanel />
    </DepartmentProvider>
  );
}
```

Não conectado ao app nesta sprint.

## Relação com sprints anteriores

| Sprint | Pacote | Relação |
|--------|--------|---------|
| 3.1 | `@douglas/agents` | Agentes registrados por departamento |
| 3.3 | `@douglas/workflow` | `WorkflowDepartment` alinhado |
| 3.6 | `@douglas/events` | Topics `department:*` futuros |
| 3.8 | `@douglas/analytics` | Métricas por departamento |
| 4.0 | `@douglas/dos` | Orquestração de boot |
| 4.1 | `@douglas/departments` | **Departamentos Inteligentes** |

## Testabilidade

```ts
const manager = new DepartmentManager();
manager.registerDepartments([{ id: "pesquisa", name: "Pesquisa", ... }]);
manager.registerAgent("pesquisa", "agent:athena");

expect(manager.reportHealth("pesquisa")?.agentCount).toBe(1);
expect(manager.getMetricsSnapshot("pesquisa")).toBeDefined();
```

Interfaces permitem mocks isolados sem Provider React.
