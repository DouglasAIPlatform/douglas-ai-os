# Runtime Control Actions Architecture — Douglas AI Platform

> Status: Foundation v1.0  
> Sprint: 5.6  
> Escopo: ações operacionais simuladas no Runtime + Event Bus.

## Objetivo

Permitir **controle básico** dos módulos do Runtime — a plataforma deixa de apenas observar e passa a executar comandos simulados com rastreabilidade via Event Bus.

## Componentes (`@douglas/runtime`)

| Componente | Função |
|------------|--------|
| `RuntimeAction` / `RuntimeActionType` | Tipos de ação e metadados |
| `RuntimeCommand` | Comando emitido pelo operador |
| `RuntimeActionResult` | Resultado com duração e status |
| `RuntimeCommandHandler` | Delega para `RuntimeManager` |
| `RuntimeControlService` | Orquestra comando + eventos + panel |
| `RuntimeControlPanel` | Histórico e último comando |
| `RuntimeControlProvider` | Context React |
| `useRuntimeControl` | Hook para widgets |

## Ações suportadas

| Ação | Método RuntimeManager | Comportamento |
|------|----------------------|---------------|
| `refresh_module` | `refreshModule()` | Reexecuta healthCheck, atualiza snapshot (simulado) |
| `pause_module` | `pauseModule()` | Transição ready → paused |
| `resume_module` | `resumeModule()` | Transição paused → ready |
| `restart_module` | `restartModule()` | stop + restart + activate |
| `run_health_check` | `runHealthCheck()` | healthCheck() + atualiza snapshot |

**Reutilização:** pause, resume e restart já existiam no Sprint 5.1. Refresh e health check foram adicionados como operações seguras/simuladas.

## Event Bus

Novos tópicos em `@douglas/events`:

```
runtime:action:started
runtime:action:completed
runtime:action:failed
```

Categoria: `runtime`. Registrados em `corporateEventDefinitions`.

### Fluxo

```
RuntimeControlWidget
    └── executeAction()
            └── RuntimeControlService.execute()
                    ├── publish runtime:action:started
                    ├── RuntimeCommandHandler → RuntimeManager
                    └── publish completed | failed
                            └── EventBusBridge → Live Event Monitor
```

## Integração

```
RuntimeProvider
└── RuntimeControlProvider (publishActionEvent → useEventBus)
    └── HealthIntegration
        └── PlatformStateIntegration
```

`RuntimeIntegration.tsx` conecta `publish()` do Corporate Event Bus ao control service.

## Segurança / limitações

| Limitação | Detalhe |
|-----------|---------|
| **Simulado** | Ações não afetam banco, servidor, APIs ou deploy |
| **Sem stop global** | `RuntimeManager.stop()` não é exposto na UI |
| **Lifecycle constraints** | Pause só em `ready`; resume só em `paused` |
| **Mock modules** | Module hooks (pause/stop/restart) são mocks vazios na app layer |
| **Eventos reais** | Publicados no Event Bus e visíveis no Live Event Monitor |
| **UI delay** | RuntimeProvider poll 2s; control provider força refresh imediato pós-ação |

## Headquarters

`RuntimeControlWidget` em `/headquarters`:

- Lista de módulos + status
- Botões de ação por módulo (habilitados conforme estado)
- Último comando e resultado
- Footer com resumo da última ação

Widgets anteriores **preservados**.

## Próximos passos

1. Expor ações no `UnifiedPlatformStatusWidget`
2. Autorização por role antes de executar comandos
3. Confirmar ações destrutivas (restart) via modal
4. Persistir histórico de comandos no Analytics Engine
5. Conectar health check real aos managers de domínio

## Testabilidade

```ts
const service = createRuntimeControlService({ manager, publish: vi.fn() });
const result = await service.execute("core", "refresh_module");
expect(result.success).toBe(true);
expect(publish).toHaveBeenCalledWith("runtime:action:started", expect.any(Object));
```
