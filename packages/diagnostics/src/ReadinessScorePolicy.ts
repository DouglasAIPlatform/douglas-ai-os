/** Política de score de readiness — evita saturação brusca em dev. */

export const READINESS_SCORE_POLICY = {
  /** Score inicial antes de penalidades. */
  BASE_SCORE: 100,
  /** Penalidade máxima quando não há issues críticos (floor = 40). */
  MAX_PENALTY_WITHOUT_CRITICAL: 60,
  /** Penalidade máxima acumulada de warnings. */
  MAX_WARNING_PENALTY: 15,
  /** Mudança mínima de score para emitir evento diagnostics. */
  SCORE_CHANGE_THRESHOLD: 5,
} as const;

export function stabilizeReadinessScore(
  rawPenalty: number,
  warningCount: number,
  criticalIssueCount: number,
): number {
  const warningPenalty = Math.min(
    warningCount * 2,
    READINESS_SCORE_POLICY.MAX_WARNING_PENALTY,
  );

  const nonWarningPenalty = Math.max(0, rawPenalty - warningCount * 2);
  const cappedNonWarning = criticalIssueCount > 0
    ? nonWarningPenalty
    : Math.min(nonWarningPenalty, READINESS_SCORE_POLICY.MAX_PENALTY_WITHOUT_CRITICAL - warningPenalty);

  const totalPenalty = warningPenalty + cappedNonWarning;
  const floor = criticalIssueCount > 0 ? 0 : READINESS_SCORE_POLICY.BASE_SCORE - READINESS_SCORE_POLICY.MAX_PENALTY_WITHOUT_CRITICAL;

  return Math.max(
    floor,
    Math.min(READINESS_SCORE_POLICY.BASE_SCORE, READINESS_SCORE_POLICY.BASE_SCORE - totalPenalty),
  );
}
