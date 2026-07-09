import { resolveDemoDataPolicy, toEventNoisePolicy } from "@douglas/demo-data";
import type { EventNoisePolicy } from "@douglas/monitor";
import { DEFAULT_EVENT_NOISE_POLICY } from "@douglas/monitor";
import { demoDataConfig } from "@/features/platform-demo-data/config";

/**
 * @deprecated Preferir useDemoData() + toEventNoisePolicy(policy) em runtime.
 * Mantido para compatibilidade com imports existentes.
 */
export const eventMonitorNoisePolicy: EventNoisePolicy = {
  ...DEFAULT_EVENT_NOISE_POLICY,
  ...toEventNoisePolicy(resolveDemoDataPolicy(demoDataConfig)),
};
