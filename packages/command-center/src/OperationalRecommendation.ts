import type {
  CommandCenterDiagnosticsInput,
  CommandCenterPlatformInput,
  OperationalRecommendation,
} from "./OperationalCommandCenterTypes";

let recommendationCounter = 0;

function createRecommendation(
  priority: OperationalRecommendation["priority"],
  message: string,
  source: string,
): OperationalRecommendation {
  recommendationCounter += 1;
  return {
    id: `op-rec-${recommendationCounter}`,
    priority,
    message,
    source,
  };
}

export function buildOperationalRecommendations(
  platform: CommandCenterPlatformInput,
  diagnostics: CommandCenterDiagnosticsInput | null,
): OperationalRecommendation[] {
  const recommendations: OperationalRecommendation[] = [];

  platform.blockers.forEach((blocker) => {
    recommendations.push(createRecommendation("high", blocker, "platform-state"));
  });

  if (diagnostics) {
    diagnostics.recommendations.forEach((rec) => {
      recommendations.push({
        id: rec.id,
        priority: rec.priority,
        message: rec.message,
        source: "diagnostics",
      });
    });

    if (!diagnostics.ready && diagnostics.criticalIssueCount > 0) {
      recommendations.push(
        createRecommendation(
          "high",
          `Resolver ${diagnostics.criticalIssueCount} problema(s) crítico(s) antes de operar`,
          "diagnostics",
        ),
      );
    }

    if (diagnostics.status === "degraded") {
      recommendations.push(
        createRecommendation(
          "medium",
          "Plataforma degradada — ações destrutivas exigem confirmação",
          "command-center",
        ),
      );
    }
  } else {
    recommendations.push(
      createRecommendation(
        "medium",
        "Aguardando diagnóstico de boot para liberar ações destrutivas",
        "command-center",
      ),
    );
  }

  if (platform.criticalModules > 0) {
    recommendations.push(
      createRecommendation(
        "high",
        `${platform.criticalModules} módulo(s) em estado crítico`,
        "platform-state",
      ),
    );
  }

  const seen = new Set<string>();
  return recommendations.filter((rec) => {
    const key = `${rec.source}:${rec.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
