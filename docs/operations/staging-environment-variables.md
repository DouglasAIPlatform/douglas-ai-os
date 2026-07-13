# Staging Environment Variables

> Sprint 5.53 — placeholders seguros. **Nunca versionar valores reais.**

## Templates

| Arquivo | Uso |
|---------|-----|
| `.env.example` | Documentação geral (development default) |
| `apps/headquarters/.env.staging.example` | Template staging — copiar para `.env.staging.local` |

## Variáveis obrigatórias (staging)

```env
NEXT_PUBLIC_DOS_ENVIRONMENT=staging
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Preencha URL e anon key **após** criar o projeto Supabase de staging.

## Regras

1. **Valores reais nunca no Git** — use `.env.staging.local` (gitignored via `.env.*.local`).
2. **service_role nunca no frontend** — apenas anon key pública.
3. **Projetos separados** — staging e production usam Supabase projects diferentes.
4. **AUDIT_INGEST_AUTH_MODE=required** — configurar via Supabase secrets, não em `.env`.

## Deploy (Vercel)

Configure as mesmas variáveis `NEXT_PUBLIC_*` no projeto Vercel de staging.

Não copie variáveis de production para staging.

## Development local

Development continua com `NEXT_PUBLIC_DOS_ENVIRONMENT=development` (ou omitido).

Staging remoto pendente **não quebra** development.

## Referências

- [Staging project bootstrap](./staging-project-bootstrap.md)
- [Manual setup checklist](./staging-manual-setup-checklist.md)
