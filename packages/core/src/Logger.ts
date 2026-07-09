import type { CoreLogLevel } from "./CoreTypes";

export interface LogEntry {
  level: CoreLogLevel;
  message: string;
  context?: Record<string, string | number | boolean>;
  createdAt: string;
}

export class Logger {
  private entries: LogEntry[] = [];
  private readonly capacity: number;
  private minLevel: CoreLogLevel;

  constructor(capacity = 200, minLevel: CoreLogLevel = "info") {
    this.capacity = capacity;
    this.minLevel = minLevel;
  }

  debug(message: string, context?: LogEntry["context"]): void {
    this.write("debug", message, context);
  }

  info(message: string, context?: LogEntry["context"]): void {
    this.write("info", message, context);
  }

  warn(message: string, context?: LogEntry["context"]): void {
    this.write("warn", message, context);
  }

  error(message: string, context?: LogEntry["context"]): void {
    this.write("error", message, context);
  }

  getRecent(limit = 20): LogEntry[] {
    return this.entries.slice(0, limit);
  }

  setMinLevel(level: CoreLogLevel): void {
    this.minLevel = level;
  }

  private write(
    level: CoreLogLevel,
    message: string,
    context?: LogEntry["context"],
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      context,
      createdAt: new Date().toISOString(),
    };

    this.entries = [entry, ...this.entries].slice(0, this.capacity);
  }

  private shouldLog(level: CoreLogLevel): boolean {
    const order: CoreLogLevel[] = ["debug", "info", "warn", "error"];
    return order.indexOf(level) >= order.indexOf(this.minLevel);
  }
}
