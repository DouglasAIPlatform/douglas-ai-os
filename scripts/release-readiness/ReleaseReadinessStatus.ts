/** Status agregado do Release Readiness Pipeline (Sprint 5.37). */
export type ReleaseReadinessStatus = "passed" | "passed_with_warnings" | "failed";

export const RELEASE_READINESS_STATUS_LABELS: Record<ReleaseReadinessStatus, string> = {
  passed: "Aprovado",
  passed_with_warnings: "Aprovado com alertas",
  failed: "Reprovado",
};

export const RELEASE_READINESS_STATUS_DESCRIPTIONS: Record<ReleaseReadinessStatus, string> = {
  passed:
    "Todos os checks obrigatórios passaram — codebase pronta para revisão de release.",
  passed_with_warnings:
    "Nenhum bloqueio crítico, mas existem alertas que merecem revisão antes do deploy.",
  failed:
    "Checks bloqueantes falharam — corrija antes de solicitar revisão de release.",
};
