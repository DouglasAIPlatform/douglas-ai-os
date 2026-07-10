import type { DemoDataConfig } from "@douglas/demo-data";
import { resolveDemoDataModeFromEnvironment } from "@douglas/environment";

/**
 * Configuração central de demo data — Headquarters.
 *
 * Modos derivados de NEXT_PUBLIC_DOS_ENVIRONMENT (Sprint 5.39).
 */
export const demoDataConfig: DemoDataConfig = {
  mode: resolveDemoDataModeFromEnvironment(),
  demoTickerIntervalMs: 8000,
};

/** Exemplo manual — desligar demo explicitamente em dev: */
// export const demoDataConfig: DemoDataConfig = {
//   mode: "manual",
//   enableDemoEvents: false,
//   enableDemoWidgets: false,
// };
