import type { DependencyEdge, DependencyNode } from "./GraphTypes";

export class DependencyNodeRegistry {
  static create(params: Omit<DependencyNode, "metadata"> & {
    metadata?: DependencyNode["metadata"];
  }): DependencyNode {
    return {
      ...params,
      metadata: params.metadata ?? {},
    };
  }
}

export class DependencyEdgeRegistry {
  static create(
    source: string,
    target: string,
    params: Omit<DependencyEdge, "id" | "source" | "target">,
  ): DependencyEdge {
    return {
      id: `${source}->${target}`,
      source,
      target,
      ...params,
    };
  }
}
