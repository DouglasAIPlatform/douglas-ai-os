# Release Readiness Agent Runbook

Operações para o segundo agente operacional — Sprint 5.52.

## Executar revisão

1. Headquarters → **Execução de Missão**
2. Selecionar **Revisão de readiness**
3. Confirmar execução
4. Revisar verdict, blockers, warnings e recomendações

## Interpretação de verdicts

| Verdict | Ação sugerida |
|---------|---------------|
| `ready_for_staging` | Prosseguir validação em staging |
| `ready_for_production_review` | Revisão humana — **não** equivale a aprovação |
| `blocked` | Resolver blockers antes de promover |
| `insufficient_data` | Verificar widgets de release/staging/environment |

## O que o agente NÃO faz

- Não aprova produção (`release:approve_production` é RBAC owner-only)
- Não executa deploy, tag, migration ou git push
- Não altera channel ou versão
- Não executa shell
- Não acessa secrets

## Diferença: diagnosticar vs recomendar vs aprovar

| Ator | Função |
|------|--------|
| System Diagnostics Agent | Diagnostica saúde operacional da plataforma |
| Release Readiness Agent | Recomenda readiness com base em snapshots de release/staging |
| Owner (humano) | Único com `release:approve_production` no RBAC |

## Troubleshooting

### Verdict `insufficient_data`

- Confirmar widgets Release Status, Staging Readiness e Environment carregados
- Operador autenticado com profile ativo

### Verdict `blocked`

- Revisar lista de blockers no relatório
- Executar `pnpm release:check` e `pnpm staging:check` (CLI) para detalhes adicionais

### Agente ocupado

- Aguardar conclusão de execução anterior ou cancelar (owner/admin)

## Validação

```bash
pnpm test
pnpm validate
pnpm release:check
```

## Referências

- [Release Readiness Agent](../agents/release-readiness-agent.md)
- [Multi-Agent Assignment](../architecture/multi-agent-assignment.md)
