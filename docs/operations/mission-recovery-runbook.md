# Mission Recovery Runbook

Procedimento operacional para execuções interrompidas após reload ou falha.

## Estados

| Status | Descrição |
|--------|-----------|
| `interrupted` | Execução em andamento encontrada após reload |
| `recovery_required` | Recovery explícito necessário (policy alternativa) |
| `completed` | Terminal — nenhuma ação automática |
| `failed` | Terminal — revisar e decidir retry manual |
| `cancelled` | Terminal — cancelada pelo operador |

## Policy

`evaluateMissionExecutionRecovery()` aplica:

- **running/assigned** após reload → `interrupted` (default)
- Agente **não reinicia** automaticamente
- Evento `mission:recovery_required` quando `shouldEmitRecoveryRequired`

## Apresentação (HQ)

`buildMissionExecutionRecoveryPresentation()` exibe:

- Estado encontrado
- Decisão da policy
- Motivo
- Timestamp
- Ação recomendada (sempre manual nesta fase)

## Ação recomendada

1. Abrir Mission Control e identificar execução interrompida
2. Revisar timeline persistida (Supabase ou session fallback em dev)
3. **Não** usar "continuar execução" automática — indisponível nesta sprint
4. Decidir: retry manual, cancelar ou investigar causa raiz
5. Registrar audit/eventos conforme política da plataforma

## Acceptance staging

O cenário **Recovery** na Staging Persistence Acceptance valida:

- Load de execução running persistida
- Policy aplicada corretamente
- Audit exactly-once
- Ação manual documentada

Ver [staging-persistence-acceptance.md](./staging-persistence-acceptance.md).

## Referências

- [persistence-rehydration-lifecycle.md](../architecture/persistence-rehydration-lifecycle.md)
- [mission-persistence-runbook.md](./mission-persistence-runbook.md)
