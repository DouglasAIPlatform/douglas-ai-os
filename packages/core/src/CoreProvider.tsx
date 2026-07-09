"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { CoreContext } from "./CoreContext";
import { CoreEngine } from "./CoreEngine";
import type { CoreModuleDefinition } from "./CoreTypes";
import type { CoreEnvironmentName } from "./CoreTypes";
import { Environment } from "./Environment";
import { Version } from "./Version";

export interface CoreProviderProps {
  children: ReactNode;
  modules: CoreModuleDefinition[];
  environment?: CoreEnvironmentName;
  platformVersion?: string;
  config?: Record<string, string | number | boolean | null>;
}

export function CoreProvider({
  children,
  modules,
  environment = "development",
  platformVersion = "0.1.0",
  config,
}: CoreProviderProps) {
  const [healthVersion, setHealthVersion] = useState(0);

  const engine = useMemo(() => {
    const instance = new CoreEngine({
      environment: new Environment(environment),
      version: new Version({ platform: platformVersion, core: "0.1.0" }),
      config,
    });

    instance.bootstrap(modules);
    return instance;
  }, [config, environment, modules, platformVersion]);

  const healthReport = useMemo(
    () => engine.getHealthReport(),
    [engine, healthVersion],
  );

  const publish = useCallback(
    (...args: Parameters<CoreEngine["publish"]>) => engine.publish(...args),
    [engine],
  );

  const subscribe = useCallback(
    (...args: Parameters<CoreEngine["subscribe"]>) => engine.subscribe(...args),
    [engine],
  );

  const getModule = useCallback(
    (moduleId: Parameters<CoreEngine["getModule"]>[0]) =>
      engine.getModule(moduleId),
    [engine],
  );

  const refreshHealth = useCallback(() => {
    const report = engine.getHealthReport();
    setHealthVersion((current) => current + 1);
    return report;
  }, [engine]);

  const value = useMemo(
    () => ({
      engine,
      isReady: engine.isReady(),
      modules: engine.registry.getAll(),
      healthReport,
      publish,
      subscribe,
      getModule,
      refreshHealth,
    }),
    [engine, getModule, healthReport, publish, refreshHealth, subscribe],
  );

  return <CoreContext.Provider value={value}>{children}</CoreContext.Provider>;
}
