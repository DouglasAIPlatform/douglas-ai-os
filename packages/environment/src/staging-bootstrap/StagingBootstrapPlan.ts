import type { StagingTargetStatus } from "./StagingTargetManifest";

export type StagingBootstrapStepPhase =
  | "preparation"
  | "remote_project"
  | "configuration"
  | "database"
  | "edge"
  | "identity"
  | "validation"
  | "approval";

export type StagingBootstrapStepStatus =
  | "prepared"
  | "pending"
  | "runtime_only";

export interface StagingBootstrapStep {
  id: string;
  order: number;
  label: string;
  phase: StagingBootstrapStepPhase;
  status: StagingBootstrapStepStatus;
  description: string;
  manualAction: string;
  validationHint?: string;
}

export interface StagingBootstrapEvidence {
  id: string;
  label: string;
  present: boolean;
  message: string;
}

export interface StagingBootstrapPlan {
  manifestVersion: string;
  generatedAt: string;
  readOnly: true;
  steps: StagingBootstrapStep[];
  evidence: StagingBootstrapEvidence[];
  suggestedFinalStatus: StagingTargetStatus;
}

export interface StagingBootstrapReport {
  plan: StagingBootstrapPlan;
  formatted: string;
}

export const STAGING_BOOTSTRAP_MANUAL_STEPS: Omit<
  StagingBootstrapStep,
  "status"
>[] = [
  {
    id: "create_supabase_project",
    order: 1,
    label: "Criar projeto Supabase de staging",
    phase: "remote_project",
    description: "Projeto dedicado, separado de development e production.",
    manualAction:
      "Crie um novo projeto no dashboard Supabase (região alinhada ao deploy). Não reutilize production.",
  },
  {
    id: "obtain_public_credentials",
    order: 2,
    label: "Obter URL pública e anon key",
    phase: "configuration",
    description: "Credenciais públicas para o frontend — nunca service_role.",
    manualAction:
      "Copie URL e anon key do projeto staging para variáveis locais/deploy. Não versionar valores reais.",
  },
  {
    id: "configure_env",
    order: 3,
    label: "Configurar variáveis locais/deploy",
    phase: "configuration",
    description: "NEXT_PUBLIC_DOS_ENVIRONMENT=staging + Supabase público.",
    manualAction:
      "Use .env.staging.local (gitignored) ou secrets do Vercel. Consulte .env.staging.example.",
  },
  {
    id: "link_supabase_cli",
    order: 4,
    label: "Vincular Supabase CLI ao staging",
    phase: "remote_project",
    description: "Link manual ao project ref — fora deste script.",
    manualAction: "supabase link --project-ref <staging-ref> (somente após criar projeto).",
    validationHint: "Confirmar supabase/config.toml aponta ao projeto correto.",
  },
  {
    id: "review_migrations_dry_run",
    order: 5,
    label: "Conferir migrations (dry-run)",
    phase: "database",
    description: "Revisar ordem e conteúdo antes de apply.",
    manualAction: "pnpm supabase:migration-plan — revisar SQL localmente.",
  },
  {
    id: "apply_migrations",
    order: 6,
    label: "Aplicar migrations manualmente",
    phase: "database",
    description: "Apply no banco staging — nunca automático nesta fase.",
    manualAction: "supabase db push ou apply manual conforme runbook.",
    validationHint: "Tabelas operator_profiles, RBAC e mission_executions presentes.",
  },
  {
    id: "configure_edge_secrets",
    order: 7,
    label: "Configurar secrets da Edge Function",
    phase: "edge",
    description: "AUDIT_INGEST_AUTH_MODE=required via Supabase secrets.",
    manualAction: "supabase secrets set AUDIT_INGEST_AUTH_MODE=required --project-ref <staging-ref>",
  },
  {
    id: "deploy_audit_ingest",
    order: 8,
    label: "Deploy manual de audit-ingest",
    phase: "edge",
    description: "Edge Function no projeto staging.",
    manualAction: "supabase functions deploy audit-ingest --project-ref <staging-ref>",
    validationHint: "Production Safety Gate — edge_function_deployed.",
  },
  {
    id: "create_owner_profile",
    order: 9,
    label: "Criar usuário e operator_profile owner",
    phase: "identity",
    description: "Conta Auth real + profile active no staging.",
    manualAction: "Signup/login no HQ staging; seed owner profile conforme runbook RBAC.",
  },
  {
    id: "validate_auth_rls_audit",
    order: 10,
    label: "Validar Auth, RLS, audit e persistence",
    phase: "validation",
    description: "Runtime no HQ staging — sem mocks.",
    manualAction:
      "Login real, profile active, audit accepted, mission persistence supabase_required sem fallback.",
    validationHint: "StagingReadinessWidget + Production Safety Gate.",
  },
  {
    id: "staging_acceptance",
    order: 11,
    label: "Executar staging acceptance",
    phase: "validation",
    description: "pnpm staging:check + release:check no contexto staging.",
    manualAction: "pnpm staging:check && pnpm release:check (com env staging configurado).",
  },
  {
    id: "human_review",
    order: 12,
    label: "Revisão humana antes de production",
    phase: "approval",
    description: "Promoção para production exige aprovação explícita.",
    manualAction: "Checklist staging-manual-setup-checklist.md assinado por operador.",
  },
];

export function buildStagingBootstrapPlan(input: {
  codebasePrepared?: boolean;
  envTemplatesPresent?: boolean;
  bootstrapPlanScriptPresent?: boolean;
}): StagingBootstrapPlan {
  const codebasePrepared = input.codebasePrepared ?? true;

  const steps: StagingBootstrapStep[] = STAGING_BOOTSTRAP_MANUAL_STEPS.map((step) => ({
    ...step,
    status:
      step.id === "review_migrations_dry_run" && codebasePrepared
        ? "prepared"
        : step.phase === "preparation"
          ? "prepared"
          : "pending",
  }));

  for (const step of steps) {
    if (
      step.id === "configure_env" &&
      input.envTemplatesPresent
    ) {
      step.status = "prepared";
    }
    if (
      ["validate_auth_rls_audit", "staging_acceptance", "human_review"].includes(step.id)
    ) {
      step.status = "runtime_only";
    }
  }

  const evidence: StagingBootstrapEvidence[] = [
    {
      id: "manifest",
      label: "StagingTargetManifest",
      present: true,
      message: "Manifesto staging — projeto separado exigido.",
    },
    {
      id: "codebase",
      label: "Codebase preparada",
      present: codebasePrepared,
      message: codebasePrepared
        ? "Políticas, docs e scripts de staging presentes."
        : "Codebase incompleta para bootstrap.",
    },
    {
      id: "env_templates",
      label: "Templates de ambiente",
      present: input.envTemplatesPresent ?? false,
      message: input.envTemplatesPresent
        ? ".env.example e .env.staging.example com placeholders."
        : "Templates ausentes.",
    },
    {
      id: "bootstrap_script",
      label: "Script staging:bootstrap-plan",
      present: input.bootstrapPlanScriptPresent ?? false,
      message: input.bootstrapPlanScriptPresent
        ? "pnpm staging:bootstrap-plan disponível."
        : "Script ausente.",
    },
  ];

  let suggestedFinalStatus: StagingTargetStatus = "not_started";
  if (codebasePrepared && input.envTemplatesPresent) {
    suggestedFinalStatus = "configuration_prepared";
  }
  if (codebasePrepared && !input.envTemplatesPresent) {
    suggestedFinalStatus = "remote_project_pending";
  }

  return {
    manifestVersion: "5.53",
    generatedAt: new Date().toISOString(),
    readOnly: true,
    steps,
    evidence,
    suggestedFinalStatus,
  };
}

export function formatStagingBootstrapPlan(plan: StagingBootstrapPlan): string {
  const lines: string[] = [];

  lines.push("Douglas AI OS — Staging Bootstrap Plan (read-only)");
  lines.push(`Gerado em: ${plan.generatedAt}`);
  lines.push(`Status sugerido: ${plan.suggestedFinalStatus}`);
  lines.push("Este plano NÃO cria projeto, NÃO aplica migrations, NÃO imprime secrets.");
  lines.push("");

  lines.push("Evidências");
  for (const item of plan.evidence) {
    lines.push(`  ${item.present ? "✓" : "○"} ${item.label}: ${item.message}`);
  }
  lines.push("");

  lines.push(`Etapas manuais (${plan.steps.length})`);
  for (const step of plan.steps) {
    const statusLabel =
      step.status === "prepared"
        ? "preparada"
        : step.status === "runtime_only"
          ? "runtime"
          : "pendente";
    lines.push(`  ${step.order}. [${statusLabel}] ${step.label}`);
    lines.push(`     ${step.description}`);
    lines.push(`     → ${step.manualAction}`);
    if (step.validationHint) {
      lines.push(`     Validação: ${step.validationHint}`);
    }
  }

  lines.push("");
  lines.push("Próximo comando: pnpm staging:check");

  return lines.join("\n");
}

export function buildStagingBootstrapReport(plan: StagingBootstrapPlan): StagingBootstrapReport {
  return {
    plan,
    formatted: formatStagingBootstrapPlan(plan),
  };
}
