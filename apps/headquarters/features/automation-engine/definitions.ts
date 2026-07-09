import {
  AUTOMATION_TRIGGER_TYPES,
  createAutomationAction,
  createAutomationTrigger,
  type AutomationDefinition,
} from "@douglas/automation";

function buildAutomation(
  id: string,
  name: string,
  description: string,
  triggerType: keyof typeof AUTOMATION_TRIGGER_TYPES,
  triggerConfig: Record<string, string | number | boolean>,
  department: string,
): AutomationDefinition {
  const now = new Date().toISOString();
  const triggerKey = AUTOMATION_TRIGGER_TYPES[triggerType];

  return {
    id: `automation:${id}`,
    name,
    description,
    status: "active",
    trigger: createAutomationTrigger({
      id: `trigger:${id}`,
      type: triggerKey,
      label: name,
      config: triggerConfig,
    }),
    actions: [
      createAutomationAction({
        id: `action:${id}:main`,
        type: "log",
        label: `Executar ${name}`,
        config: { department, simulated: true },
        order: 1,
      }),
    ],
    metadata: {
      workspaceId: "ws:douglas-os",
      department,
      tags: [triggerKey, department],
    },
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

export const automationDefinitions: AutomationDefinition[] = [
  buildAutomation(
    "daily-report",
    "Relatório Diário",
    "Automação cron para consolidação diária de métricas.",
    "CRON",
    { cron: "0 8 * * *", timezone: "America/Sao_Paulo" },
    "financeiro",
  ),
  buildAutomation(
    "webhook-lead",
    "Webhook Lead CRM",
    "Automação acionada por webhook externo de novos leads.",
    "WEBHOOK",
    { path: "/hooks/crm/lead", method: "POST" },
    "crm",
  ),
  buildAutomation(
    "manual-youtube",
    "Publicação Manual YouTube",
    "Automação disparada manualmente para fluxo de publicação.",
    "MANUAL",
    { scope: "youtube" },
    "youtube",
  ),
  buildAutomation(
    "api-calma-sync",
    "Sync API Calma",
    "Automação invocada via API interna para sincronização Calma.",
    "API",
    { endpoint: "/api/calma/sync", method: "POST" },
    "calma",
  ),
  buildAutomation(
    "event-marketing",
    "Evento Campanha Marketing",
    "Automação reativa a eventos internos de campanha.",
    "INTERNAL_EVENT",
    { event: "marketing:campaign:launched" },
    "marketing",
  ),
];
