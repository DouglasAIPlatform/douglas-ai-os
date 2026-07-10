# Release Checklist — Douglas AI Platform

> Status: Foundation v1.0  
> Sprint: 5.37  
> Escopo: checklist humano antes de revisão de release e deploy manual.

## Quando executar

| Momento | Ação |
|---------|------|
| Antes de abrir PR para `main` | `pnpm release:check` local |
| PR aberto / merge em `main` | CI (`validate.yml` + `release-readiness.yml`) |
| Antes de tag / release notes | `pnpm release:check` + revisão deste checklist |
| Antes de deploy em staging/prod | Production Safety Gate no ambiente |

## Checklist técnico (automático)

Execute:

```bash
pnpm release:check
```

Confirme status `passed` ou `passed_with_warnings` com warnings revisados.

Checks obrigatórios cobertos pelo comando:

- [ ] `pnpm validate` (typecheck, lint, build)
- [ ] Migrations Supabase presentes (`supabase/migrations/`)
- [ ] Edge Function `audit-ingest` presente
- [ ] `.env.example` na raiz
- [ ] `.env.local` **não** rastreado pelo Git
- [ ] `supabase/.temp/` **não** rastreado pelo Git
- [ ] Audit `writeMode: "edge_function"` no Headquarters
- [ ] Documentação operacional/arquitetura obrigatória
- [ ] Scan de secrets versionados sem achados bloqueantes

## Checklist operacional (manual)

Após `release:check` aprovado:

### Repositório

- [ ] Changelog ou notas de release preparadas
- [ ] PR revisado por pelo menos um operador
- [ ] Nenhum `.env*` real commitado
- [ ] Branch alinhada com `main`

### Supabase (manual — fora do release:check)

- [ ] Plano de migrations revisado: `pnpm supabase:migration-plan`
- [ ] Migrations aplicadas no ambiente alvo conforme `docs/operations/apply-supabase-migrations.md`
- [ ] Edge Function `audit-ingest` deployada manualmente (se alterada)
- [ ] Variáveis de ambiente do projeto configuradas (sem expor `service_role` no frontend)

### Runtime (Production Safety Gate)

No Headquarters conectado ao ambiente alvo:

- [ ] Production Safety Gate sem status `blocked`
- [ ] Auth e `operator_profiles` operacionais
- [ ] Audit ingest remoto observado (quando aplicável)
- [ ] Fila de pendências dentro do limite

Ver `docs/operations/production-safety-gate.md`.

## Local vs CI

| Item | Local | CI |
|------|-------|-----|
| `pnpm validate` | Sim | Sim (`validate.yml`) |
| `pnpm release:check` | Sim | Sim (`release-readiness.yml`) |
| Secrets Supabase | Não exigidos | Não exigidos |
| Deploy | Manual | Nunca automático |
| Apply migrations | Manual | Nunca automático |

## Limites desta esteira

O Release Readiness Pipeline **não** substitui:

- testes E2E ou QA manual
- Production Safety Gate (runtime)
- revisão de segurança de RLS/policies
- monitoramento pós-deploy

Ele responde: *“A codebase no Git está em condições de ir para revisão de release?”*

## Interpretação de warnings

| Warning típico | Ação |
|----------------|------|
| Chave ausente em `.env.example` | Atualizar exemplo antes do merge |
| Path sensível fora do `.gitignore` | Adicionar padrão ao `.gitignore` |
| Handler Edge não identificado | Revisar `supabase/functions/audit-ingest/index.ts` |

Warnings não bloqueiam CI, mas devem ser resolvidos ou documentados antes de produção.

## Por que deploy continua manual

- Credenciais reais não entram no CI nesta fase
- Apply de migrations exige janela e backup operacional
- Deploy de Edge Function exige validação pós-deploy no ambiente
- Revisão humana é gate final antes de produção

## Referências

- `docs/engineering/release-readiness-pipeline.md`
- `docs/engineering/validation-pipeline.md`
- `docs/operations/apply-supabase-migrations.md`
- `docs/operations/supabase-migration-checklist.md`
- `docs/operations/production-safety-gate.md`
- `docs/architecture/audit-edge-function.md`
