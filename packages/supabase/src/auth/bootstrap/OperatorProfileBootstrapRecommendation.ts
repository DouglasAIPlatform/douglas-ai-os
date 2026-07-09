import type { OperatorProfileBootstrapStatus } from "./OperatorProfileBootstrapStatus";

export interface OperatorProfileBootstrapRecommendation {
  title: string;
  summary: string;
  steps: string[];
  /** SQL orientativo — sem secrets; user_id do usuário autenticado quando aplicável. */
  manualSqlHint?: string;
  docPaths: string[];
}

export function buildOperatorProfileBootstrapRecommendation(
  status: OperatorProfileBootstrapStatus,
  options: {
    userId?: string;
    tableDetected?: boolean;
  } = {},
): OperatorProfileBootstrapRecommendation {
  const docPaths = [
    "docs/architecture/operator-profile-bootstrap.md",
    "docs/architecture/auth-operator-handoff.md",
    "docs/operations/apply-supabase-migrations.md",
  ];

  switch (status) {
    case "not_configured":
      return {
        title: "Configure Supabase primeiro",
        summary:
          "Defina NEXT_PUBLIC_SUPABASE_URL e anon key — bootstrap de profile depende de auth real.",
        steps: [
          "Copie .env.example para .env.local.",
          "Preencha variáveis públicas do projeto Supabase.",
          "Reinicie Headquarters e valide em Supabase Staging Validation.",
        ],
        docPaths,
      };

    case "not_authenticated":
      return {
        title: "Autentique-se para verificar profile",
        summary:
          "Bootstrap de operator_profiles só se aplica após login Supabase bem-sucedido.",
        steps: [
          "Confirme migrations aplicadas (operator_profiles existe).",
          "Acesse /login e autentique com usuário de staging.",
          "Retorne a este widget para verificar status do profile.",
        ],
        docPaths,
      };

    case "profile_found":
      return {
        title: "Profile operacional ativo",
        summary: "Nenhum bootstrap necessário — handoff auth → operator deve usar auth_profile.",
        steps: [
          "Confirme role efetiva no Auth Status widget.",
          "Valide permissões via Runtime Control (PermissionGuard).",
        ],
        docPaths,
      };

    case "bootstrap_required":
      return {
        title: "Aplique migrations e crie o primeiro owner",
        summary: options.tableDetected
          ? "Tabela existe — falta row inicial de owner/admin."
          : "Tabela operator_profiles não detectada — migration pendente.",
        steps: options.tableDetected
          ? [
              "Abra Supabase Dashboard → SQL Editor (role service).",
              "Execute INSERT seguro para o user_id autenticado (ver SQL abaixo).",
              "Faça logout/login ou refreshSession no Auth widget.",
            ]
          : [
              "Aplique migrations conforme docs/operations/apply-supabase-migrations.md.",
              "Reexecute Supabase Staging Validation.",
              "Crie primeiro owner via SQL Editor (service_role).",
            ],
        manualSqlHint: options.userId
          ? `-- SQL Editor (service_role) — substituir display_name se necessário\nINSERT INTO public.operator_profiles (user_id, display_name, role, status)\nVALUES ('${options.userId}', 'Platform Owner', 'owner', 'active');`
          : undefined,
        docPaths,
      };

    case "bootstrap_blocked_by_rls":
      return {
        title: "Bootstrap administrativo obrigatório",
        summary:
          "RLS permite INSERT apenas para owner/admin existentes — o browser anon/authenticated não pode criar o primeiro owner.",
        steps: [
          "Não tente INSERT pelo client — falhará com policy operator_profiles_insert_admin.",
          "Use Supabase Dashboard → SQL Editor com privilégios service_role.",
          "Ou aguarde Edge Function/admin flow futuro (Sprint posterior).",
          "Após INSERT, refreshSession e confirme profile_found neste widget.",
        ],
        manualSqlHint: options.userId
          ? `-- Primeiro owner (service_role only)\nINSERT INTO public.operator_profiles (user_id, display_name, role, status)\nVALUES ('${options.userId}', 'Platform Owner', 'owner', 'active');`
          : undefined,
        docPaths: [...docPaths, "docs/operations/supabase-migration-checklist.md"],
      };

    case "profile_missing":
    default:
      return {
        title: "Profile operacional ausente",
        summary:
          "Usuário autenticado sem operator_profiles — RBAC efetivo permanece mock (fallback).",
        steps: [
          "Verifique se migrations foram aplicadas.",
          "Confirme user_id em auth.users corresponde ao INSERT.",
          "Provisione owner manualmente se tabela existir.",
        ],
        manualSqlHint: options.userId
          ? `-- Verificar auth.users\n-- SELECT id, email FROM auth.users WHERE id = '${options.userId}';\n-- Depois INSERT em operator_profiles via service_role.`
          : undefined,
        docPaths,
      };
  }
}
