import type { DependencyGraphInput, DependencyReport } from "./GraphTypes";
import { DependencyMap } from "./DependencyMap";
import { DependencyReportBuilder, DependencyValidator } from "./DependencyReport";
import { DependencyResolver } from "./DependencyResolver";
import { CircularDependencyDetector } from "./CircularDependencyDetector";

export class DependencyGraph {
  private readonly map = new DependencyMap();
  private readonly resolver = new DependencyResolver();
  private readonly cycleDetector = new CircularDependencyDetector();
  private readonly validator = new DependencyValidator();
  private latestReport: DependencyReport | null = null;

  load(input: DependencyGraphInput): void {
    this.map.load(input.nodes, input.edges);
  }

  analyze(): DependencyReport {
    this.latestReport = this.validator.validate(this.map);
    return this.latestReport;
  }

  getReport(): DependencyReport | null {
    return this.latestReport;
  }

  getLoadOrder(): string[] {
    return this.resolver.resolveLoadOrder(this.map);
  }

  detectCycles(): ReturnType<CircularDependencyDetector["detect"]> {
    return this.cycleDetector.detect(this.map);
  }

  getMap(): DependencyMap {
    return this.map;
  }
}

export function createDependencyGraph(input: DependencyGraphInput): DependencyGraph {
  const graph = new DependencyGraph();
  graph.load(input);
  graph.analyze();
  return graph;
}

export { DependencyReportBuilder };
