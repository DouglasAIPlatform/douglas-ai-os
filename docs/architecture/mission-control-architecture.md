# Mission Control Architecture — Douglas AI Platform

> Status: Foundation v0.1  
> Sprint: 4.2  
> Escopo: infraestrutura Mission Control em `packages/missions/`.

## Objetivo

Criar a infraestrutura do **Mission Control** — centro de comando para missões independentes da Douglas AI Platform, preparado para execução automática futura.

Cada missão é **autônoma**: não depende de outras missões. Escopos (projeto, agente, departamento, produto) são **vínculos opcionais**, não acoplamento.

Nesta sprint **não há integração** com Workflow, Agent Framework, Departments, DOS ou AppShell.

## Pacote

```
packages/missions/src/
├── MissionTypes.ts              # MissionData, scopes, execution policy
├── MissionPriority.ts           # Ordenação e labels
├── interfaces/
│   ├── IMissionRepository.ts    # Persistência + IMissionExecutor (futuro)
│   ├── IMissionManager.ts       # IMissionBoard
│   ├── IMissionProgress.ts
│   ├── IMissionTimeline.ts
│   └── IMissionHistory.ts
├── Mission.ts                   # Entidade Mission (independente)
├── InMemoryMissionRepository.ts
├── MissionProgress.ts
├── MissionTimeline.ts
├── MissionHistory.ts
├── MissionBoard.ts              # Kanban por status
├── MissionManager.ts            # Orquestrador central
├── MissionProvider.tsx
├── MissionBoardPanel.tsx
└── index.ts
```

## Seeds (app)

```
apps/headquarters/features/mission-control/
├── seeds.ts    # 5 missões mock (project, agent, department, product)
└── index.ts
```

Sem wiring no `AppShell` nesta sprint.

## Princípio: missões independentes

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Mission A   │  │  Mission B   │  │  Mission C   │
│  (isolada)   │  │  (isolada)   │  │  (isolada)   │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │ scopes          │ scopes          │ scopes
       ▼ (opcional)      ▼                 ▼
   project/agent    department/product   ...
```

- Nenhuma missão referencia `dependsOn: missionId`
- Escopos são metadados de contexto, não dependências
- Falha de Mission A não afeta Mission B

## Escopos preparados

| Tipo | Uso |
|------|-----|
| `project` | Projetos estratégicos |
| `agent` | Agentes responsáveis |
| `department` | Departamentos Inteligentes (Sprint 4.1) |
| `product` | Produtos/plugins (Calma, CRM, YouTube) |

```ts
interface MissionScope {
  type: "project" | "agent" | "department" | "product";
  refId: string;
  label?: string;
}
```

## Componentes

### Mission

Entidade que encapsula `MissionData`:

```ts
const mission = Mission.fromData(data);

mission.isIndependent;           // sempre true
mission.isAutomatic;             // execution.mode === "automatic"
mission.isReadyForAutoExecution; // automatic + planned + executorId
```

### MissionPriority

`low` | `normal` | `high` | `critical` — ordenação via `compareMissionPriority()`.

### MissionProgress

Implementa `IMissionProgress`:

- `initialize(totalSteps?)` — estado inicial
- `update(current, patch)` — atualização parcial
- `advanceStep(current)` — avança step e recalcula percent
- `percentFromSteps(completed, total)` — cálculo de percentual

### MissionTimeline

Trilha cronológica por missão:

| Tipo | Quando |
|------|--------|
| `created` | Missão criada |
| `status_change` | Transição de status |
| `progress_update` | Progresso alterado |
| `scope_linked` | Escopo vinculado |
| `execution_scheduled` | Execução agendada (futuro) |
| `note` | Anotação manual |

### MissionHistory

Auditoria com snapshot imutável:

`created` | `updated` | `started` | `progress_updated` | `completed` | `failed` | `blocked` | `archived`

### MissionBoard

Implementa `IMissionBoard` — visão kanban:

```
┌──────────┬──────────┬──────────┬──────────┐
│ Planejada│  Ativa   │ Bloqueada│ Concluída│
└──────────┴──────────┴──────────┴──────────┘
```

Missões ordenadas por prioridade dentro de cada coluna.

### MissionManager

Orquestrador via `IMissionManager`:

```ts
const manager = new MissionManager();

manager.create({ title: "Nova missão", priority: "high" });
manager.linkScope(id, { type: "agent", refId: "agent:athena" });
manager.start(id);
manager.updateProgress(id, { percent: 50 });
manager.complete(id);
manager.block(id, "Aguardando aprovação");

manager.board.build();                    // MissionBoardView
manager.listAutomaticPlanned();           // prontas para execução auto
```

## Execução automática (futuro)

Arquitetura preparada via `MissionExecutionPolicy`:

```ts
interface MissionExecutionPolicy {
  mode: "manual" | "automatic";
  retryable?: boolean;
  maxRetries?: number;
  scheduledAt?: string;    // ISO — agendamento
  executorId?: string;     // agent ID ou workflow ID
}
```

Interface `IMissionExecutor` (contrato, sem implementação):

```ts
interface IMissionExecutor {
  canExecute(mission: MissionData): boolean;
  execute(mission: MissionData): Promise<{ success: boolean; message: string }>;
}
```

Fluxo futuro:

```
Scheduler → listAutomaticPlanned()
         → IMissionExecutor.canExecute()
         → IMissionExecutor.execute()
         → manager.complete() | manager.block()
```

## Modelo MissionData

```ts
interface MissionData {
  id: string;
  title: string;
  description: string;
  status: MissionStatus;
  priority: MissionPriority;
  progress: MissionProgressState;
  scopes: MissionScope[];           // vínculos opcionais
  execution: MissionExecutionPolicy;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  metadata: MissionMetadata;
}
```

### Status

`draft` → `planned` → `active` → `completed` | `failed` | `blocked` → `archived`

## Inversão de dependência

| Interface | Default | Futuro |
|-----------|---------|--------|
| `IMissionRepository` | InMemory | Supabase |
| `IMissionProgress` | MissionProgress | — |
| `IMissionTimeline` | MissionTimeline | Event Bus bridge |
| `IMissionHistory` | MissionHistory | Data warehouse |
| `IMissionExecutor` | — | Agent/Workflow adapter |

```ts
new MissionManager({
  repository: customRepository,
  progress: customProgress,
  timeline: customTimeline,
  history: customHistory,
});
```

## Escalabilidade

### 1. Independência total

Missões não compartilham estado. Escala horizontal por missão.

### 2. Execução automática plugável

`IMissionExecutor` permite múltiplos executores (agente, workflow, cron) sem alterar MissionManager.

### 3. Board extensível

`MISSION_BOARD_STATUSES` configurável — adicionar colunas custom sem breaking change.

### 4. Integração com Departments (Sprint 4.1)

```ts
manager.linkScope(missionId, { type: "department", refId: "pesquisa" });
// → departmentManager.receiveTask() via adapter futuro
```

### 5. Integração com DOS (Sprint 4.0)

Boot DOS → seed missions → `listAutomaticPlanned()` para fila de execução.

### 6. Integração com Agent Framework

`executorId: "agent:athena"` → `IMissionExecutor` delega ao AgentManager.

## Integração futura (fora desta sprint)

1. `MissionProvider` no AppShell
2. Implementação de `IMissionExecutor` com AgentManager + WorkflowEngine
3. Scheduler cron para `listAutomaticPlanned()`
4. Rota `/missions` com `MissionBoardPanel`
5. Bridge timeline → Corporate Event Bus
6. Dashboard metrics por missão → Analytics Engine

## Uso arquitetural (referência)

```tsx
import { MissionProvider, MissionBoardPanel } from "@douglas/missions";
import { missionSeeds } from "@/features/mission-control";

function MissionControlPage() {
  return (
    <MissionProvider seedMissions={missionSeeds}>
      <MissionBoardPanel />
    </MissionProvider>
  );
}
```

Não conectado ao app nesta sprint.

## Relação com sprints anteriores

| Sprint | Pacote | Relação |
|--------|--------|---------|
| 3.1 | `@douglas/agents` | Escopo `agent` + `executorId` |
| 3.3 | `@douglas/workflow` | `executorId` workflow |
| 3.9 | `@douglas/plugins` | Escopo `product` |
| 4.0 | `@douglas/dos` | Orquestração de boot |
| 4.1 | `@douglas/departments` | Escopo `department` |
| 4.2 | `@douglas/missions` | **Mission Control** |

## Testabilidade

```ts
const manager = new MissionManager();
const mission = manager.create({ title: "Test", execution: { mode: "automatic", executorId: "agent:x" } });

expect(Mission.fromData(mission).isReadyForAutoExecution).toBe(false); // status draft
manager.transition(mission.id, "planned");
expect(Mission.fromData(manager.get(mission.id)!).isReadyForAutoExecution).toBe(true);
```
