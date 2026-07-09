import type { DependencyMap } from "./DependencyMap";

export interface CircularDependencyResult {
  hasCycle: boolean;
  cycles: string[][];
}

export class CircularDependencyDetector {
  detect(map: DependencyMap): CircularDependencyResult {
    const nodeIds = [...map.getNodeIds()];
    const visited = new Set<string>();
    const stack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (nodeId: string, path: string[]) => {
      if (stack.has(nodeId)) {
        const cycleStart = path.indexOf(nodeId);
        if (cycleStart >= 0) {
          cycles.push([...path.slice(cycleStart), nodeId]);
        }
        return;
      }

      if (visited.has(nodeId)) return;

      visited.add(nodeId);
      stack.add(nodeId);

      map.getOutgoingEdges(nodeId).forEach((edge) => {
        dfs(edge.target, [...path, nodeId]);
      });

      stack.delete(nodeId);
    };

    nodeIds.forEach((nodeId) => {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    });

    return {
      hasCycle: cycles.length > 0,
      cycles,
    };
  }
}
