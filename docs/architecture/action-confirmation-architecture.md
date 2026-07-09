# Action Confirmation System — Douglas AI Platform

> Status: Implementado (Sprint 5.12)  
> Escopo: confirmação operacional via modal — substitui `window.confirm`.

## Objetivo

Substituído `window.confirm` por um fluxo de confirmação próprio, integrado ao Security Layer e ao Event Bus.

## Componentes (`@douglas/security`)

| Componente | Função |
|------------|--------|
| `ActionConfirmationRequest` | Dados da confirmação pendente (ação, módulo, risco, consequência) |
| `ActionConfirmationResult` | `{ requestId, confirmed, resolvedAt }` |
| `ActionConfirmationContext` | Contexto React com `pending` e `requestConfirmation()` |
| `ActionConfirmationProvider` | Gerencia estado, modal, audit e eventos |
| `ActionConfirmationModal` | UI operacional com cancelar/confirmar |
| `useActionConfirmation()` | Hook para solicitar confirmação via Promise |

## Fluxo

```
RuntimeControlWidget
    └── handleAction()
            ├── PermissionGuard bloqueia → recordBlocked
            ├── requiresConfirmation?
            │       └── requestConfirmation(input)  ← Promise
            │               ├── recordConfirmationRequested → Event Bus
            │               ├── ActionConfirmationModal exibido
            │               ├── Confirmar → recordConfirmed → resolve(true)
            │               └── Cancelar → recordCancelled → resolve(false)
            └── recordAllowed + executeAction
```

## Ações que exigem confirmação

Definidas em `SENSITIVE_ACTIONS` (`ActionPolicy.ts`):

- `pause_module`
- `resume_module`
- `restart_module`

Também exigem confirmação quando readiness está degradado (`DESTRUCTIVE_ACTIONS` + `readinessRequiresConfirmation`).

## Modal — conteúdo

- Nome da ação (`actionLabel`)
- Módulo afetado (`moduleName`)
- Risco (`low` / `medium` / `high`)
- Consequência esperada (texto por ação em `ActionConfirmationPolicy`)
- Contexto adicional opcional (ex.: gate de readiness)
- Botões **Cancelar** e **Confirmar**

## Event Bus

| Tópico | Quando |
|--------|--------|
| `security:action:confirmation_requested` | Modal aberto |
| `security:action:confirmed` | Operador confirmou |
| `security:action:cancelled` | Operador cancelou |

## Histórico — substituição de `window.confirm`

**Antes (removido):**

```typescript
const confirmed = window.confirm(message);
if (!confirmed) {
  security.recordCancelled(...);
  return;
}
security.recordConfirmed(...);
```

**Depois:**

```typescript
const result = await requestConfirmation(
  buildActionConfirmationInput(action, moduleId, moduleName, label, reason),
);
if (!result.confirmed) return;
// recordConfirmed/recordCancelled feitos pelo Provider
```

## Reutilização para futuras ações críticas

1. Adicionar a ação em `SecuredActionType` e `ACTION_PERMISSION_MAP`
2. Incluir em `SENSITIVE_ACTIONS` se sempre exigir confirmação
3. Registrar risco/consequência em `ActionConfirmationPolicy.ts`
4. No widget ou serviço, chamar `requestConfirmation(buildActionConfirmationInput(...))`

Qualquer componente dentro de `ActionConfirmationProvider` pode usar `useActionConfirmation()` — não precisa de modal próprio.

## Integração Headquarters

`SecurityIntegration` envolve a árvore com:

```
OperatorProvider → ActionConfirmationProvider → children
```

## Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `packages/security/src/ActionConfirmation*.tsx` | Modal, Provider, Context |
| `packages/security/src/ActionConfirmationPolicy.ts` | Risco/consequência por ação |
| `packages/security/src/SecurityLayer.ts` | `recordConfirmationRequested` |
| `packages/events/src/TypedEvents.ts` | Novo tópico |
| `features/platform-security/SecurityIntegration.tsx` | Provider |
| `components/widgets/RuntimeControlWidget.tsx` | Sem `window.confirm` |
