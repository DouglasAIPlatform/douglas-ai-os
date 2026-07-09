export type ConfigValue = string | number | boolean | null;

export class Config {
  private values = new Map<string, ConfigValue>();

  set(key: string, value: ConfigValue): void {
    this.values.set(key, value);
  }

  get(key: string): ConfigValue | undefined {
    return this.values.get(key);
  }

  getString(key: string, fallback = ""): string {
    const value = this.values.get(key);
    return typeof value === "string" ? value : fallback;
  }

  getBoolean(key: string, fallback = false): boolean {
    const value = this.values.get(key);
    return typeof value === "boolean" ? value : fallback;
  }

  getNumber(key: string, fallback = 0): number {
    const value = this.values.get(key);
    return typeof value === "number" ? value : fallback;
  }

  merge(values: Record<string, ConfigValue>): void {
    Object.entries(values).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  entries(): Record<string, ConfigValue> {
    return Object.fromEntries(this.values.entries());
  }
}
