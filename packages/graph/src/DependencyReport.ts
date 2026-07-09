import type {
  DependencyGraphStatus,
  DependencyIssue,
  DependencyReport,
} from "./GraphTypes";
import { CircularDependencyDetector } from "./CircularDependencyDetector";
import type { DependencyMap } from "./DependencyMap";
import { DependencyResolver } from "./DependencyResolver";

let issueCounter = 0;

function createIssue(
  type: DependencyIssue["type"],
  severity: DependencyIssue["severity"],
  message: string,
  moduleId?: string,
  edgeId?: string,
): DependencyIssue {
  issueCounter += 1;
  return {
    id: `dep-issue-${issueCounter}`,
    type,
    severity,
    message,
    moduleId,
    edgeId,
    detectedAt: new Date().toISOString(),
  };
}

function resolveGraphStatus(issues: DependencyIssue[]): DependencyGraphStatus {
  if (issues.some((issue) => issue.severity === "critical")) return "critical";
  if (issues.length > 0) return "warning";
  return "healthy";
}

export class DependencyValidator {
  private readonly cycleDetector = new CircularDependencyDetector();
  private readonly resolver = new DependencyResolver();

  validate(map: DependencyMap): DependencyReport {
    const nodes = map.getAllNodes();
    const edges = map.getAllEdges();
    const issues: DependencyIssue[] = [];

    edges.forEach((edge) => {
      if (!map.hasNode(edge.source)) {
        issues.push(
          createIssue(
            "missing_dependency",
            "critical",
            `Source module "${edge.source}" not found for edge ${edge.id}`,
            edge.source,
            edge.id,
          ),
        );
      }
      if (!map.hasNode(edge.target)) {
        issues.push(
          createIssue(
            "missing_dependency",
            "critical",
            `Target module "${edge.target}" not found for edge ${edge.id}`,
            edge.target,
            edge.id,
          ),
        );
      }
    });

    const cycleResult = this.cycleDetector.detect(map);
    cycleResult.cycles.forEach((cycle) => {
      issues.push(
        createIssue(
          "circular_dependency",
          "critical",
          `Circular dependency detected: ${cycle.join(" → ")}`,
          cycle[0],
        ),
      );
    });

    const rootIds = new Set(["core"]);
    nodes.forEach((node) => {
      const incoming = map.getIncomingEdges(node.id);
      const outgoing = map.getOutgoingEdges(node.id);

      if (incoming.length === 0 && outgoing.length === 0 && !rootIds.has(node.id)) {
        issues.push(
          createIssue(
            "orphan_module",
            "warning",
            `Module "${node.name}" has no dependencies and no dependents`,
            node.id,
          ),
        );
      }
    });

    edges.forEach((edge) => {
      if (!edge.required) return;

      const targetNode = map.getNode(edge.target);
      const isUnavailable =
        edge.status === "missing" ||
        edge.status === "unavailable" ||
        edge.status === "critical" ||
        targetNode?.status === "critical" ||
        targetNode?.status === "offline";

      if (isUnavailable) {
        issues.push(
          createIssue(
            "critical_unavailable",
            "critical",
            `Required dependency ${edge.source} → ${edge.target} is unavailable (${edge.status})`,
            edge.source,
            edge.id,
          ),
        );
      }
    });

    const healthyEdgeCount = edges.filter((edge) => edge.status === "healthy").length;
    const warningEdgeCount = edges.filter((edge) => edge.status === "warning").length;
    const criticalEdgeCount = edges.filter(
      (edge) =>
        edge.status === "critical" ||
        edge.status === "missing" ||
        edge.status === "unavailable",
    ).length;

    return {
      status: resolveGraphStatus(issues),
      moduleCount: nodes.length,
      edgeCount: edges.length,
      healthyEdgeCount,
      warningEdgeCount,
      criticalEdgeCount,
      orphanModuleCount: issues.filter((issue) => issue.type === "orphan_module").length,
      circularDependencyCount: cycleResult.cycles.length,
      missingDependencyCount: issues.filter((issue) => issue.type === "missing_dependency")
        .length,
      criticalUnavailableCount: issues.filter(
        (issue) => issue.type === "critical_unavailable",
      ).length,
      nodes,
      edges,
      issues,
      loadOrder: this.resolver.resolveLoadOrder(map),
      generatedAt: new Date().toISOString(),
    };
  }
}

export class DependencyReportBuilder {
  build(map: DependencyMap): DependencyReport {
    return new DependencyValidator().validate(map);
  }
}
