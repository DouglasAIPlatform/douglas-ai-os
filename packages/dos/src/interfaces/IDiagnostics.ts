import type { DiagnosticEntry } from "../DOSTypes";

export interface IDiagnostics {
  record(entry: Omit<DiagnosticEntry, "id" | "timestamp">): DiagnosticEntry;
  getAll(): DiagnosticEntry[];
  getByLevel(level: DiagnosticEntry["level"]): DiagnosticEntry[];
  getBySource(source: string): DiagnosticEntry[];
  getRecent(limit?: number): DiagnosticEntry[];
  clear(): void;
}
