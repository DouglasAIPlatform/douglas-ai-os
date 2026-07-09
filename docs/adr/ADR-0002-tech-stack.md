# ADR-0002: Stack tecnológica da plataforma

| Campo | Valor |
|-------|-------|
| **Status** | Proposed |
| **Data** | — |
| **Decisores** | Engenharia Douglas AI Platform |
| **Relacionado** | [Tech Stack](../architecture/tech-stack.md) |

---

## Contexto

Com o monorepo definido ([ADR-0001](ADR-0001-monorepo.md)), é necessário estabelecer (ou reservar decisão sobre) a stack tecnológica para frontend, backend, agentes, dados e infraestrutura, alinhada a escalabilidade e ao perfil do time.

<!-- TODO: Incluir requisitos não-funcionais: latência, multi-tenant, regiões, etc. -->

---

## Decisão

**Fase atual:** documentar categorias de tecnologia e reservar escolhas específicas para revisão na Sprint Foundation, conforme tabela abaixo.

| Camada | Decisão | Status |
|--------|---------|--------|
| Linguagem principal | TypeScript (recomendado) | A confirmar |
| Monorepo tooling | *Pendente* | ADR em revisão |
| Frontend | *Pendente* | Ver `docs/frontend/` |
| Backend / API | *Pendente* | Ver `docs/backend/` |
| Agentes / LLM | *Pendente* | Ver `docs/agents/` |
| Banco de dados | *Pendente* | Ver `docs/database/` |
| CI/CD | GitHub Actions | Adotado |
| IDE / DX | Cursor (`.cursor/`) | Adotado |

<!-- TODO: Marcar cada linha como Accepted após decisão formal -->

---

## Consequências

### Positivas

- ADR centraliza debate antes de lock-in tecnológico
- Documentação `tech-stack.md` reflete decisões aceitas
- Time pode paralelizar spikes por camada

### Negativas

- Atraso em scaffold de apps até fechar stack crítica
- Risco de inconsistência se spikes não convergirem

---

## Alternativas consideradas

<!-- TODO: Por camada — ex.: Next.js vs Remix, Node vs Python para agentes, Postgres vs Supabase -->

| Camada | Alternativa A | Alternativa B | Notas |
|--------|---------------|---------------|-------|
| — | — | — | A preencher |

---

## Critérios de avaliação

1. **Produtividade do time** — curva de aprendizado e hiring
2. **Ecossistema IA** — SDKs, streaming, tool calling
3. **Operação** — observabilidade, deploy, custo
4. **Segurança** — ver `docs/security/`
5. **Fit com monorepo** — compartilhamento de tipos e configs

---

## Próximos passos

<!-- TODO: Converter itens em tasks no sprint-foundation.md -->

- [ ] Spike: runtime backend + framework HTTP
- [ ] Spike: framework frontend + design system
- [ ] Spike: orquestração de agentes
- [ ] Atualizar este ADR para **Accepted** com stack fechada
- [ ] Atualizar `docs/architecture/tech-stack.md`

---

## Referências

- [ADR-0001: Monorepo](ADR-0001-monorepo.md)
- [Tech Stack](../architecture/tech-stack.md)
- [Sprint Foundation](../roadmap/sprint-foundation.md)
