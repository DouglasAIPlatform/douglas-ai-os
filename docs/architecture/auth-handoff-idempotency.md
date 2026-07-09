# Auth Handoff Event Idempotency

Sprint **5.31** torna os eventos `auth:operator:handoff_*` idempotentes e previsíveis, evitando duplicação causada por re-renders do React sem perder auditabilidade de transições reais.

## Por que os eventos podem duplicar

O `AuthOperatorBridge` publica eventos em um `useEffect` que depende de `authSession` e `resolution`. Mesmo quando o estado de handoff **não muda**, re-renders podem ocorrer porque:

- `authSession` recebe nova referência de objeto a cada refresh do provider
- `useMemo` recalcula `resolution` quando qualquer campo da sessão muda
- React Strict Mode remonta efeitos em development
- Transições intermediárias (`loading`) podiam ser seguidas de reavaliações idênticas

Antes da Sprint 5.31, a deduplicação comparava apenas `handoffState` via `useRef`, ignorando mudanças de **user id** ou **role do profile** com o mesmo estado, e ainda podia falhar se o snapshot completo não fosse comparado de forma estável.

## Como a deduplicação funciona

```
AuthOperatorBridge
      │
      ▼
createHandoffStateSnapshot(resolution, userId)
      │
      ▼
HandoffEventDeduplicator.evaluate(snapshot)
      │
      ├── auth loading? → skip
      ├── snapshot igual ao anterior? → skip
      ├── primeira observação estável? → registra snapshot, skip
      ├── classifyHandoffTransition(prev, current)
      │        └── null → skip
      ├── resolveHandoffEventTopics(transition)
      └── filtra por HandoffEventKey já emitida (HandoffEventHistory)
                │
                ▼
         publish(topic, payload)  → Event Bus → Monitor + Audit
```

### HandoffStateSnapshot

Fingerprint estável com:

- `handoffState`
- `userId`
- `operatorId`
- `effectiveRole`
- `authProfileRole`
- `operatorSource`

### HandoffEventKey

Chave determinística:

```
{topic}|{previousFingerprint}->{currentFingerprint}|{reason}
```

Garante que a mesma transição não emite o mesmo tópico duas vezes.

### HandoffEventHistory

Histórico in-memory (até 100 chaves) + última transição relevante para UI.

## Mudanças que geram eventos

| Mudança | Motivo | Eventos típicos |
|---------|--------|-----------------|
| `mock_operator` → `authenticated_with_profile` | `handoff_state_changed` | started + completed |
| `authenticated_without_profile` → `authenticated_with_profile` | `handoff_state_changed` | started + completed |
| `authenticated_with_profile` → `profile_error` | `handoff_state_changed` | started + failed + fallback |
| Qualquer → `profile_error` | `handoff_state_changed` | started + failed + fallback |
| Login sem profile | `handoff_state_changed` | started + fallback |
| Role do profile mudou | `profile_role_changed` | started + completed |
| User id mudou | `user_id_changed` | started + (completed/fallback/failed conforme estado atual) |

**Não gera eventos:**

- Re-render com snapshot idêntico
- Sessão em `loading`
- Primeira observação após mount (baseline silenciosa)

## Integração com Event Monitor e Audit Log

Nenhuma alteração nos consumidores downstream. Eventos continuam publicados via `useEventBus().publish()` com `source: authentication`. O `@douglas/audit` mapeia os mesmos tópicos para entradas de audit.

A deduplicação ocorre **antes** da publicação — Monitor e Audit recebem apenas emissões relevantes.

## UI — AuthStatusWidget

Exibe **Último handoff relevante** quando disponível:

- Estado anterior / atual
- Timestamp
- Motivo (`HANDOFF_TRANSITION_REASON_LABELS`)
- Mensagem descritiva da transição

Dados via `useHandoffEventBridge()` (contexto fornecido pelo `AuthOperatorBridge`).

## Módulos

| Módulo | Pacote |
|--------|--------|
| `HandoffStateSnapshot` | `@douglas/supabase/auth/handoff` |
| `HandoffEventKey` | `@douglas/supabase/auth/handoff` |
| `HandoffEventPolicy` | `@douglas/supabase/auth/handoff` |
| `HandoffEventHistory` | `@douglas/supabase/auth/handoff` |
| `HandoffEventDeduplicator` | `@douglas/supabase/auth/handoff` |
| `HandoffEventBridgeContext` | Headquarters `platform-auth` |

## Riscos e próximos passos

| Risco | Mitigação atual | Próximo passo |
|-------|-----------------|---------------|
| Histórico só in-memory | Perdido no refresh | Opcional: persistir última transição em sessionStorage |
| Remount completo do bridge | Baseline reinicia | Aceitável — transições reais re-emitem |
| Mock role hardcoded no bridge | Pre-existente (`admin`) | Usar mock role via ref/callback |
| Transição rápida loading→auth | Baseline na 1ª obs. estável | Monitorar edge cases em staging |

## Referências

- [auth-operator-handoff.md](./auth-operator-handoff.md)
- [auth-foundation.md](./auth-foundation.md)
