export interface EventNoisePolicy {
  /**
   * Quando false, o ticker mock (8s) não ingere novos eventos demo.
   * Seeds iniciais permanecem no log — use filtros de exibição para ocultá-los.
   */
  enableDemoEvents: boolean;
  /** Intervalo do ticker mock em ms (somente quando enableDemoEvents=true). */
  demoTickerIntervalMs?: number;
}

export const DEFAULT_EVENT_NOISE_POLICY: EventNoisePolicy = {
  enableDemoEvents: true,
  demoTickerIntervalMs: 8000,
};

export function isDemoTickerEnabled(policy: EventNoisePolicy): boolean {
  return policy.enableDemoEvents;
}
