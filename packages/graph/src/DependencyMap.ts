import type { DependencyEdge, DependencyNode } from "./GraphTypes";

export class DependencyMap {
  private nodes = new Map<string, DependencyNode>();
  private edges = new Map<string, DependencyEdge>();

  load(nodes: DependencyNode[], edges: DependencyEdge[]): void {
    this.nodes.clear();
    this.edges.clear();

    nodes.forEach((node) => this.nodes.set(node.id, node));
    edges.forEach((edge) => this.edges.set(edge.id, edge));
  }

  getNode(id: string): DependencyNode | undefined {
    return this.nodes.get(id);
  }

  getEdge(id: string): DependencyEdge | undefined {
    return this.edges.get(id);
  }

  getAllNodes(): DependencyNode[] {
    return [...this.nodes.values()];
  }

  getAllEdges(): DependencyEdge[] {
    return [...this.edges.values()];
  }

  getNodeIds(): Set<string> {
    return new Set(this.nodes.keys());
  }

  getOutgoingEdges(nodeId: string): DependencyEdge[] {
    return this.getAllEdges().filter((edge) => edge.source === nodeId);
  }

  getIncomingEdges(nodeId: string): DependencyEdge[] {
    return this.getAllEdges().filter((edge) => edge.target === nodeId);
  }

  hasNode(id: string): boolean {
    return this.nodes.has(id);
  }
}
