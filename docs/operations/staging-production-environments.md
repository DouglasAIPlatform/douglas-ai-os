# Staging & Production Environments — Douglas AI Platform

> Status: Foundation v1.1  
> Sprint: 5.39 / **5.41**  
> Escopo: operação segura de ambientes staging e production.

**VERCEL_ENV** (`preview` / `production`) é hint de deploy — **não substitui** `NEXT_PUBLIC_DOS_ENVIRONMENT`. Divergências geram alertas no widget e no Production Safety Gate. Detalhes: [environment-resolution.md](../architecture/environment-resolution.md).

## Development vs Staging vs Production

| | Development | Staging | Production |
|---|-------------|---------|------------|
| **Objetivo** | Iteração local | Validação pré-prod | Usuários reais |
| **Supabase** | Projeto dev (opcional) | **Projeto separado** | **Projeto separado** |
| **Mocks** | Permitidos | Bloqueados | Bloqueados |
| **Login** | Opcional | Real esperado | Real obrigatório |
| **Deploy** | `pnpm dev` | Manual | Manual + release review |
| **DOS env var** | `development` (default) | `staging` | `production` |

## Por que projetos Supabase separados

- Isolamento de dados — staging nunca compartilha dados de produção
- RLS e migrations testadas sem risco
- Edge Functions e secrets independentes
- Rollback e promoção controlados

**Nunca** use o mesmo `NEXT_PUBLIC_SUPABASE_URL` em staging e production.

## Configuração de variáveis (Vercel — futuro)

Por ambiente no dashboard Vercel:

| Variável | Escopo | Notas |
|----------|--------|-------|
| `NEXT_PUBLIC_DOS_ENVIRONMENT` | Public | `staging` ou `production` |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | URL do projeto **daquele** ambiente |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Anon key do projeto correspondente |

Secrets server-side (Edge Functions, CI):

- `SUPABASE_SERVICE_ROLE_KEY` — **nunca** no frontend
- Configurar apenas no Supabase Dashboard / deploy manual de Edge

## Valores públicos vs nunca versionados

### Públicos (podem ir em `.env.example`)

- `NEXT_PUBLIC_DOS_ENVIRONMENT`
- `NEXT_PUBLIC_SUPABASE_URL` (placeholder vazio)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (placeholder vazio)

### Nunca versionar

- `.env.local`, `.env.production.local`
- `service_role` keys
- JWT secrets, tokens pessoais
- `supabase/.temp/`

## Promoção staging → production

1. `pnpm release:check` verde no branch de release
2. Production Safety Gate verde em **staging** (auth profile, edge_function, sem mocks)
3. Apply migrations no projeto staging — validar
4. Apply migrations no projeto production — janela operacional
5. Deploy Edge Function `audit-ingest` em production (manual)
6. Definir `NEXT_PUBLIC_DOS_ENVIRONMENT=production` no deploy
7. Production Safety Gate em production — revisão humana final
8. Checklist: `docs/operations/release-checklist.md`

Deploy continua **manual** nesta fase — a plataforma valida, não publica.

## Sem Supabase configurado

Development funciona sem Supabase — mocks e fallback local permanecem disponíveis. Staging/production exigem Supabase configurado + auth real (validado pelo Safety Gate).

## Referências

- `docs/architecture/environment-separation.md`
- `docs/operations/apply-supabase-migrations.md`
- `docs/operations/production-safety-gate.md`
- `.env.example`
