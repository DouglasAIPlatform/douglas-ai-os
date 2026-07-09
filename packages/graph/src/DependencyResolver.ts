import type { DependencyMap } from "./DependencyMap";

export class DependencyResolver {
  resolveLoadOrder(map: DependencyMap): string[] {
    const nodeIds = [...map.getNodeIds()];
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      map.getOutgoingEdges(nodeId).forEach((edge) => {
        visit(edge.target);
      });

      order.push(nodeId);
    };

    nodeIds.forEach((nodeId) => visit(nodeId));
    return order;
  }

  getDependencies(map: DependencyMap, nodeId: string): string[] {
    return map.getOutgoingEdges(nodeId).map((edge) => edge.target);
  }

  getDependents(map: DependencyMap, nodeId: string): string[] {
    return map.getIncomingEdges(nodeId).map((edge) => edge.source);
  }
}
