import type { DiagnosticEntry } from "./DOSTypes";
import type { IDiagnostics } from "./interfaces/IDiagnostics";

export class Diagnostics implements IDiagnostics {
  private entries: DiagnosticEntry[] = [];
  private readonly capacity: number;

  constructor(capacity = 500) {
    this.capacity = capacity;
  }

  record(entry: Omit<DiagnosticEntry, "id" | "timestamp">): DiagnosticEntry {
    const diagnostic: DiagnosticEntry = {
      id: `diagnostic:${Date.now()}:${this.entries.length}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.entries = [diagnostic, ...this.entries].slice(0, this.capacity);
    return diagnostic;
  }

  getAll(): DiagnosticEntry[] {
    return [...this.entries];
  }

  getByLevel(level: DiagnosticEntry["level"]): DiagnosticEntry[] {
    return this.entries.filter((entry) => entry.level === level);
  }

  getBySource(source: string): DiagnosticEntry[] {
    return this.entries.filter((entry) => entry.source === source);
  }

  getRecent(limit = 20): DiagnosticEntry[] {
    return this.entries.slice(0, limit);
  }

  clear(): void {
    this.entries = [];
  }
}
