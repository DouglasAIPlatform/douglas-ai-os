# Safety & Permissions Architecture — Douglas AI Platform

> Status: Foundation v1.1  
> Sprint: 5.9 (+ 5.12 confirmação operacional)  
> Escopo: segurança operacional mínima (mock/local).

## Objetivo

Preparar uma **camada de autorização** para ações operacionais do Runtime sem implementar login real, banco ou Supabase.

## Pacote `@douglas/security`

```
packages/security/src/
├── SecurityTypes.ts          # OperatorRole, Permission (re-exporta tipos de @douglas/events)
├── Permission.ts             # ROLE_PERMISSIONS + helpers
├── ActionPolicy.ts           # Mapeamento ação → permissão + sensibilidade
├── PermissionGuard.ts        # Avalia se operador pode executar ação
├── ActionConfirmation.ts     # Serviço de solicitações de confirmação
├── ActionConfirmationProvider.tsx  # Modal operacional (Sprint 5.12)
├── ActionAuditLog.ts         # Log in-memory de decisões
├── SecurityLayer.ts          # Orquestrador + publicação de eventos
├── OperatorContext.ts
├── OperatorProvider.tsx      # Operador mock + troca de role (dev)
└── useOperator.ts
```

**Decisão:** `@douglas/security` importa tipos de payload de `@douglas/events` (`SecurityActionEventPayload`, `SecuredActionType`, etc.).

## Roles mockadas

| Role | Permissões |
|------|------------|
| `viewer` | `platform:view` — visualizar apenas |
| `operator` | view + `runtime:refresh`, `runtime:health_check` |
| `admin` | operator + `runtime:pause`, `runtime:resume`, `runtime:restart` |
| `owner` | todas as permissões |

## Fluxo de decisão (RuntimeControlWidget)

```
Clique em ação
    ├── PermissionGuard.evaluate()
    │       ├── blocked → audit + security:action:blocked
    │       └── allowed → continua
    ├── readiness gate (Command Center)
    ├── requiresConfirmation? → ActionConfirmationModal (useActionConfirmation)
    │       ├── cancel → security:action:cancelled
    │       └── confirm → security:action:confirmed
    ├── security:action:allowed
    └── RuntimeControlService.execute()
```

### Confirmação obrigatória

- `pause_module`, `resume_module`, `restart_module` — `SENSITIVE_ACTIONS`
- Ações destrutivas quando readiness degradado (via `ActionPolicy`)

Ver também: [action-confirmation-architecture.md](./action-confirmation-architecture.md)

## Event Bus

| Tópico | Quando |
|--------|--------|
| `security:action:confirmation_requested` | Modal de confirmação aberto |
| `security:action:allowed` | Permissão concedida, antes da execução |
| `security:action:blocked` | Role sem permissão |
| `security:action:confirmed` | Operador confirmou ação sensível |
| `security:action:cancelled` | Operador cancelou confirmação |

Categoria: `security`. Publisher: `authentication` (source mock).

Contratos de payload: [operational-event-contracts.md](./operational-event-contracts.md)

## Integração

```
RuntimeControlProvider
└── SecurityIntegration (OperatorProvider + ActionConfirmationProvider + event publish)
    └── AuditIntegration
        └── HealthIntegration
            └── PlatformOperationalIntegration
```

Hook `useSecuredRuntimeActions()` combina:
- `useOperationalCommandCenter()` — readiness gate
- `useOperator()` — PermissionGuard

## Conexão futura com login real

1. **Substituir `MOCK_OPERATORS`** — `OperatorProvider` recebe `operator` de session/JWT em vez de role mock
2. **Role mapping** — claims do IdP (`admin`, `operator`) mapeados para `OperatorRole`
3. **Persistir audit** — Operational Audit Log + ActionAuditLog correlacionados via `auditId`
4. **Remover seletor mock** — dropdown de role no widget é apenas para dev/teste
5. **RBAC externo** — `ROLE_PERMISSIONS` pode vir de config ou policy service

Interface estável para migração:

```tsx
<OperatorProvider operator={session.operator} publishSecurityEvent={...}>
```

## Riscos restantes

| Risco | Detalhe |
|-------|---------|
| **Mock only** | Qualquer usuário pode trocar role no dropdown — sem enforcement server-side |
| **Audit in-memory** | ActionAuditLog perdido ao recarregar (Operational Audit Log persiste em localStorage) |
| **Sem rate limiting** | Ações podem ser disparadas repetidamente |
| **Source spoofing** | Event Bus local não valida identidade do publisher |

## Mocks que permanecem

- Operadores em `MOCK_OPERATORS`
- Seletor de role no RuntimeControlWidget (dev only)
- ActionAuditLog em memória (cap 50 entries)

## Próximos passos

1. Persistência unificada de audit (Supabase)
2. Integração com auth provider (Supabase/OAuth) quando existir
3. Remover dropdown mock em produção
4. Rate limit por operador/ação
