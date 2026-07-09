import type { DependencyGraphInput, DependencyNodeStatus } from "@douglas/graph";
import type { PlatformHealthSources } from "../platform-health/checks";
import { platformDependencyGraphInput } from "./seeds";

function mapModuleToNodeStatus(
  moduleId: string,
  sources: PlatformHealthSources,
): DependencyNodeStatus {
  const bootstrap = sources.findBootstrapModule(moduleId);
  const runtime = sources.findRuntimeModule(moduleId);

  if (!sources.bootstrapReady && !sources.runtimeRunning) return "offline";

  const bootstrapFailed = bootstrap?.status === "failed" || bootstrap?.health === "unhealthy";
  const runtimeFailed = runtime?.status === "failed" || runtime?.health === "unhealthy";

  if (bootstrapFailed || runtimeFailed) return "critical";

  const bootstrapDegraded =
    bootstrap?.status === "degraded" || bootstrap?.health === "degraded";
  const runtimeDegraded =
    runtime?.status === "paused" || runtime?.health === "degraded";

  if (bootstrapDegraded || runtimeDegraded) return "warning";

  if (runtime?.status === "ready" || bootstrap?.status === "ready") return "healthy";

  return "unknown";
}

function mapEdgeStatus(sourceId: string, targetId: string, sources: PlatformHealthSources) {
  const sourceStatus = mapModuleToNodeStatus(sourceId, sources);
  const targetStatus = mapModuleToNodeStatus(targetId, sources);

  if (targetStatus === "critical" || sourceStatus === "critical") return "critical" as const;
  if (targetStatus === "offline") return "unavailable" as const;
  if (targetStatus === "warning" || sourceStatus === "warning") return "warning" as const;
  if (targetStatus === "healthy") return "healthy" as const;
  return "warning" as const;
}

export function buildLiveDependencyGraphInput(
  sources: PlatformHealthSources,
): DependencyGraphInput {
  const nodes = platformDependencyGraphInput.nodes.map((node) => ({
    ...node,
    status: mapModuleToNodeStatus(node.id, sources),
  }));

  const edges = platformDependencyGraphInput.edges.map((edge) => ({
    ...edge,
    status: mapEdgeStatus(edge.source, edge.target, sources),
  }));

  return { nodes, edges };
}
