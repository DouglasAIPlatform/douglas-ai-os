import type { DemoDataConfig } from "@douglas/demo-data";

/**
 * Configuração central de demo data — Headquarters.
 *
 * Modos:
 * - development: demo ligado (padrão em dev)
 * - production: demo desligado (padrão em build production)
 * - manual: flags explícitas abaixo
 */
export const demoDataConfig: DemoDataConfig = {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  demoTickerIntervalMs: 8000,
};

/** Exemplo manual — desligar demo explicitamente em dev: */
// export const demoDataConfig: DemoDataConfig = {
//   mode: "manual",
//   enableDemoEvents: false,
//   enableDemoWidgets: false,
// };
