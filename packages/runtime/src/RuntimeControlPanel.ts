import type { RuntimeActionResult, RuntimeCommand } from "./RuntimeControlTypes";

const HISTORY_CAPACITY = 20;

export class RuntimeControlPanel {
  private lastCommand: RuntimeCommand | null = null;
  private lastResult: RuntimeActionResult | null = null;
  private history: RuntimeActionResult[] = [];

  recordCommand(command: RuntimeCommand): void {
    this.lastCommand = command;
  }

  recordResult(result: RuntimeActionResult): void {
    this.lastResult = result;
    this.history = [result, ...this.history].slice(0, HISTORY_CAPACITY);
  }

  getLastCommand(): RuntimeCommand | null {
    return this.lastCommand;
  }

  getLastResult(): RuntimeActionResult | null {
    return this.lastResult;
  }

  getHistory(limit = 10): RuntimeActionResult[] {
    return this.history.slice(0, limit);
  }
}
