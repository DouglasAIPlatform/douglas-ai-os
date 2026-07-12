# Agent History Runbook

Operações para histórico e métricas de agentes — Sprint 5.51.

## Verificação rápida

1. Abrir Headquarters → widget **Histórico de Agentes**
2. Abrir `/agents` → confirmar métricas e tabela de histórico
3. Executar diagnóstico → verificar nova linha no histórico
4. Recarregar página → histórico deve persistir (Supabase ou sessionStorage)

## Scopes na UI

| Botão | Comportamento |
|-------|---------------|
| Combinado | Sessão + Supabase deduplicado |
| Sessão | Apenas execuções da aba |
| Persistido | Apenas `mission_executions` |

## Persistência ativa

- **Supabase ativa:** adapter `supabase`, sem fallback
- **Fallback sessão:** `mission:persistence_fallback` no event bus; histórico combined usa sessão quando remoto vazio
- Retry sync disponível no widget de missão quando fallback ativo

## Paginação

- Padrão 10 entradas; botão **Carregar mais**
- Não aumentar `maxPageSize` sem revisar performance no browser
- Registros além do limite de retenção são truncados na UI — **sem DELETE remoto**

## Retention policy

`AgentExecutionRetentionPolicy`:

| Parâmetro | Valor |
|-----------|-------|
| `defaultPageSize` | 10 |
| `maxPageSize` | 50 |
| `defaultRecentLimit` | 20 |
| `sessionMemoryLimit` | 100 |

**Nesta sprint:** nenhuma limpeza destrutiva remota. Exclusão futura exige confirmação explícita.

## Eventos operacionais

| Evento | Ação sugerida |
|--------|---------------|
| `agent:history_rehydrated` | Informativo — histórico carregado após bootstrap |
| `agent:metrics_updated` | Informativo — refresh de métricas |
| `agent:history_load_failed` | Verificar Supabase, auth e RLS |

Leituras comuns **não** geram centenas de audits (`audited: true` nos payloads).

## Troubleshooting

### Histórico vazio com Supabase configurado

1. Confirmar migration `20250710210000_mission_executions.sql` aplicada
2. Verificar operador autenticado (RLS `require_active_operator()`)
3. Confirmar `assigned_agent_id` preenchido nas execuções

### Métricas divergentes sessão vs combined

Esperado: sessão reflete runtime in-memory; combined inclui persistido. Use scope **Combinado** para visão operacional completa.

### Dados sensíveis na UI

Resumos passam por `sanitizeHistoryDisplayText`. Se vazamento detectado, abrir issue — não exibir payload completo na UI.

## Validação

```bash
pnpm test
pnpm validate
pnpm staging:check
pnpm release:check
```

Checks específicos: `agent_execution_history_*` no release readiness.

## Referências

- [Agent Execution History](../agents/agent-execution-history.md)
- [Agent Metrics](../architecture/agent-metrics.md)
- [Mission Persistence Runbook](./mission-persistence-runbook.md)
