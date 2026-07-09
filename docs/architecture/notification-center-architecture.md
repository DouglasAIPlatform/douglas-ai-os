# Notification Center Architecture — Douglas AI Platform

> Status: Foundation v0.1  
> Sprint: 3.7  
> Escopo: centro de notificações em `packages/notifications/`.

## Objetivo

Centralizar notificações in-app da Douglas AI Platform com tipagem forte, store em memória, histórico de auditoria e UI composável.

Nesta sprint **não há integração** com Event Bus, Workflow, Agentes, AppShell ou canais externos (e-mail, push, SMS). A entrega é arquitetura pura preparada para os oito domínios corporativos.

## Pacote

```
packages/notifications/src/
├── NotificationType.ts       # Tipos, domínios, prioridades, canais
├── NotificationPriority.ts   # Re-export de prioridades
├── NotificationChannel.ts    # Re-export de canais
├── NotificationStore.ts      # CRUD, filtros, contagem
├── NotificationHistory.ts    # Trilha de auditoria
├── NotificationContext.ts    # Contrato React
├── NotificationProvider.tsx  # Provider + seed
├── useNotifications.ts       # Hook de consumo
├── NotificationCard.tsx      # Card individual
├── NotificationCenter.tsx    # Painel de listagem
└── index.ts
```

## Seeds (app)

```
apps/headquarters/features/notifications/
├── seeds.ts    # 8 notificações mock (1 por domínio)
└── index.ts
```

Sem wiring no `AppShell` nesta sprint.

## Domínios preparados

| Domínio | Uso futuro |
|---------|------------|
| `system` | Core, health checks, manutenção |
| `ai` | Agentes, inferência, memória |
| `workflow` | Pipelines, execuções, falhas |
| `financeiro` | Relatórios, alertas, aprovações |
| `marketing` | Campanhas, conteúdo, métricas |
| `calma` | Sessões, jornadas, bem-estar |
| `youtube` | Upload, publicação, analytics |
| `crm` | Leads, follow-ups, pipeline |

Cada domínio é um membro de `NotificationDomain` com label em português via `NOTIFICATION_DOMAIN_LABELS`.

## Modelo de dados

### NotificationType

```ts
type NotificationType = "info" | "success" | "warning" | "error" | "action";
```

### NotificationPriority

```ts
type NotificationPriority = "low" | "normal" | "high" | "urgent";
```

Ordenação no store: `urgent` → `high` → `normal` → `low`, depois por `createdAt` decrescente.

### NotificationChannel

```ts
type NotificationChannel = "in_app" | "email" | "push" | "sms" | (string & {});
```

Canal define **destino de entrega futuro**. Nesta sprint apenas `in_app` é renderizado; os demais ficam no modelo para roteamento posterior.

### Notification

```ts
interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  channel: NotificationChannel;
  domain: NotificationDomain;
  title: string;
  message: string;
  status: "unread" | "read" | "archived" | "dismissed";
  createdAt: string;
  readAt?: string;
  dismissedAt?: string;
  metadata: NotificationMetadata;
}
```

`metadata` aceita `sourceId`, `actionHref`, `correlationId` e chaves extensíveis para correlação com Event Bus e workflows.

## Camadas

```
┌─────────────────────────────────────────────────────────┐
│  UI: NotificationCenter → NotificationCard              │
├─────────────────────────────────────────────────────────┤
│  React: NotificationProvider + useNotifications         │
├─────────────────────────────────────────────────────────┤
│  Store: NotificationStore (estado ativo)                │
│  Audit: NotificationHistory (trilha imutável)           │
└─────────────────────────────────────────────────────────┘
```

### NotificationStore

- `add`, `get`, `list`, `markAsRead`, `markAllAsRead`, `dismiss`, `archive`, `remove`
- `list(filter?)` com filtros por type, priority, channel, domain, status
- `unreadCount()` para badge futuro no header
- `seed()` para dados mock

### NotificationHistory

- Registra snapshot a cada ação: `created`, `read`, `dismissed`, `archived`, `removed`
- Capacidade configurável (padrão 500 entradas, FIFO)
- `getByNotificationId`, `getByAction`, `getRecent`

Separação intencional: **Store** = estado atual; **History** = auditoria e analytics.

### NotificationProvider

Instancia `NotificationStore` + `NotificationHistory` uma vez, expõe API reativa via `version` bump.

Props opcionais:

```tsx
<NotificationProvider seedNotifications={notificationSeeds}>
  {children}
</NotificationProvider>
```

### useNotifications

Retorna store, history, lista reativa, contagem não lida, seleção ativa e mutações.

## Escalabilidade

### 1. Domínios extensíveis

`NotificationDomain` usa union conhecida + `(string & {})`. Novos departamentos (ex.: `legal`, `rh`) entram sem quebrar tipagem existente.

### 2. Canais desacoplados

O modelo já distingue `channel` de `domain`. Integração futura:

```
Event Bus (topic) → NotificationRouter → ChannelAdapter
                                              ├── InAppAdapter  (NotificationStore.add)
                                              ├── EmailAdapter  (SendGrid/Resend)
                                              ├── PushAdapter   (FCM/Web Push)
                                              └── SmsAdapter    (Twilio)
```

Cada adapter implementa a mesma interface `NotificationInput` → entrega externa.

### 3. Store substituível

`NotificationStore` é uma classe pura sem React. Troca futura:

| Fase | Backend |
|------|---------|
| v0.1 (atual) | `Map` in-memory |
| v0.2 | IndexedDB / localStorage (offline) |
| v1.0 | API REST + Supabase Realtime |
| v2.0 | Particionamento por `domain` + TTL |

A interface pública (`add`, `list`, `markAsRead`, …) permanece estável.

### 4. Filtros e paginação

`NotificationFilter` já suporta slice por domínio. Próximo passo: `list({ domain, cursor, limit })` sem alterar componentes UI.

### 5. Priorização

Ordenação por prioridade + timestamp evita starvation de urgentes. Com volume alto, índice secundário por `(domain, status)` ou Redis sorted set.

### 6. Histórico vs. estado

History com capacidade limitada protege memória. Em produção: stream para data warehouse; store mantém apenas janela ativa (ex.: 90 dias).

### 7. Correlação com Event Bus (Sprint 3.6)

Integração futura sem acoplamento:

```ts
// subscriber no Event Bus
subscribe("workflow:completed", (_, payload) => {
  addNotification({
    type: "success",
    domain: "workflow",
    title: "Workflow concluído",
    message: payload.workflowId,
    metadata: { correlationId: payload.executionId },
  });
});
```

O pacote `@douglas/notifications` **não importa** `@douglas/events` — inversão de dependência preservada.

### 8. UI composável

- `NotificationCard` — item isolado, reutilizável em toast, drawer, inbox
- `NotificationCenter` — lista completa com filtro opcional por domínio
- Badge no header = `unreadCount` do hook (integração futura no AppShell)

### 9. Multi-tenant (futuro)

`metadata.tenantId` ou campo top-level quando necessário; filtros no store estendem `NotificationFilter`.

## Integração futura (fora desta sprint)

1. `NotificationProvider` no `AppShell` após `EventProvider`
2. Subscriber no Corporate Event Bus mapeando topics → notificações
3. Rota `/notifications` ou drawer no layout
4. Persistência Supabase (`notifications` table + RLS)
5. Adapters por canal (e-mail, push)

## Uso arquitetural (referência)

```tsx
import {
  NotificationProvider,
  NotificationCenter,
} from "@douglas/notifications";
import { notificationSeeds } from "@/features/notifications";

function NotificationsPage() {
  return (
    <NotificationProvider seedNotifications={notificationSeeds}>
      <NotificationCenter />
    </NotificationProvider>
  );
}
```

Não conectado ao app nesta sprint — apenas contrato documentado.
