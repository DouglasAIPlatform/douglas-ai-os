# Checklist — Supabase Migrations

> Sprint 5.23  
> Use antes, durante e após aplicar migrations. Marque cada item.

## Metadados

| Campo | Valor |
|-------|-------|
| Ambiente alvo | ☐ local ☐ staging ☐ production |
| Operador | |
| Data | |
| Project ref | (Dashboard — não é secret) |
| Migrations até | `20250707130003_operator_sessions.sql` |

---

## 1. Pré-voo

- [ ] Li `docs/operations/apply-supabase-migrations.md`
- [ ] Executei `pnpm supabase:migration-plan` e confirmei ordem das 4 migrations
- [ ] Revisei SQL em `supabase/migrations/` (sem alterações não commitadas)
- [ ] `.env.local` **não** está no git (`git check-ignore .env.local`)
- [ ] `.env.example` contém apenas placeholders vazios
- [ ] Tenho Supabase CLI instalado (`supabase --version`)
- [ ] **Staging primeiro** — produção só após validação completa
- [ ] Backup confirmado (Dashboard ou snapshot) — obrigatório para staging/prod

---

## 2. Secrets e variáveis

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada no ambiente alvo (se for testar app)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada no ambiente alvo
- [ ] **Nenhuma** `service_role` / DB password / JWT secret em frontend ou `.env.example`
- [ ] Secrets de server (se usados) apenas em Vercel encrypted / CI secrets — não no repo

---

## 3. Aplicar migration

### Local (dev)

- [ ] `supabase start` OK
- [ ] `supabase db reset` executado (aceito perda de dados local)
- [ ] Sem erros no output do CLI

### Remoto (staging/prod)

- [ ] `supabase link --project-ref <ref>` (se ainda não linkado)
- [ ] `supabase db diff --linked` revisado
- [ ] `supabase db push` executado
- [ ] Output sem erros SQL

---

## 4. Validar tabelas

- [ ] `operator_role_permissions` existe + seed de permissions
- [ ] `operator_profiles` existe + FK `auth.users`
- [ ] `operational_audit_entries` existe + índices (`timestamp`, `audit_id`, `correlation_id`)
- [ ] `operator_sessions` existe
- [ ] `row_security = true` em todas (query information_schema / Dashboard)

---

## 5. Validar RLS

- [ ] RLS enabled em todas as tabelas acima
- [ ] INSERT audit como `authenticated` **falha** (esperado)
- [ ] INSERT audit como `anon` **falha** (esperado)
- [ ] SELECT audit como `anon` **sem dados** (esperado)
- [ ] UPDATE/DELETE em audit **negados**
- [ ] `operator_sessions` INSERT/UPDATE/DELETE negados no client
- [ ] Bootstrap owner documentado (primeiro perfil via service_role ou Dashboard)

---

## 6. Validar helpers

- [ ] `current_auth_user_id()` existe
- [ ] `current_operator_role()` existe
- [ ] `has_platform_role()` existe
- [ ] Enums `platform_operator_role`, `platform_operator_status`, `platform_session_status` existem

---

## 7. Validar Headquarters (app)

Com env vars configuradas:

- [ ] `pnpm validate` passa no repo
- [ ] App inicia sem crash
- [ ] **SupabaseConnectionWidget:** status `connected` (ou `configured` se probe table falhar parcialmente)
- [ ] **AuthStatusWidget:** modo coerente (`supabase_ready` / `mock`)
- [ ] **AuditTrailWidget:** painel persistência visível; fallback local OK se INSERT remoto falhar

Sem env vars:

- [ ] App inicia normalmente
- [ ] Supabase status `not_configured`
- [ ] Audit usa `localStorage` only

---

## 8. Validar logs e observabilidade

- [ ] Nenhum log de console expõe anon key ou URL com credenciais
- [ ] Widgets mostram apenas status genéricos (não URL/key completas)
- [ ] Erros de health check não incluem secrets (mensagens PostgREST/Auth OK)
- [ ] CI/build não imprime env vars Supabase

---

## 9. Pós-apply

- [ ] `supabase db advisors --linked` revisado (se remoto)
- [ ] Documentar data/versão aplicada no ticket ou changelog interno
- [ ] Plano para bootstrap `operator_profiles` (owner inicial) definido
- [ ] Plano para Edge Function audit write (Sprint futura) registrado

---

## 10. Rollback (se necessário)

- [ ] Backup identificado para restore
- [ ] **Não** usar `db reset` em produção
- [ ] Rollback via restore Dashboard **ou** migration corretiva forward-only
- [ ] Incidente documentado

---

## Resultado

| | |
|-|-|
| **Status final** | ☐ Aprovado ☐ Aprovado com ressalvas ☐ Reprovado |
| **Ressalvas** | |
| **Próximo passo** | |

Referência: [apply-supabase-migrations.md](./apply-supabase-migrations.md)
