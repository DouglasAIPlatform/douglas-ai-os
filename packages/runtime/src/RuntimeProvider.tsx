"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { IRuntimeEventBus } from "./interfaces/IRuntimeEventBus";
import { PlatformRuntime } from "./PlatformRuntime";
import { RuntimeContext } from "./RuntimeContext";
import type { RuntimeModuleDefinition } from "./RuntimeTypes";

export interface RuntimeProviderProps {
  children: ReactNode;
  platformVersion: string;
  modules: RuntimeModuleDefinition[];
  enabled?: boolean;
  eventBus?: IRuntimeEventBus;
  runtime?: PlatformRuntime;
}

export function RuntimeProvider({
  children,
  platformVersion,
  modules,
  enabled = true,
  eventBus,
  runtime: externalRuntime,
}: RuntimeProviderProps) {
  const [runtime] = useState(
    () => externalRuntime ?? new PlatformRuntime({ eventBus }),
  );
  const [isStarting, setIsStarting] = useState(false);
  const [shutdownReport, setShutdownReport] = useState(null as import("./RuntimeTypes").RuntimeShutdownReport | null);
  const [monitorReport, setMonitorReport] = useState(null as import("./RuntimeTypes").RuntimeMonitorReport | null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    setIsStarting(true);

    runtime
      .start({ platformVersion, modules })
      .then(() => {
        if (!active) return;
        setIsStarting(false);
        setMonitorReport(runtime.getManager().getMonitorReport());
        setVersion((current) => current + 1);
      })
      .catch(() => {
        if (!active) return;
        setIsStarting(false);
        setVersion((current) => current + 1);
      });

    return () => {
      active = false;
      runtime.stop().then((report) => {
        setShutdownReport(report);
      });
    };
  }, [enabled, modules, platformVersion, runtime]);

  useEffect(() => {
    if (!enabled || isStarting) return;

    const interval = setInterval(() => {
      setMonitorReport(runtime.getManager().getMonitorReport());
      setVersion((current) => current + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, [enabled, isStarting, runtime]);

  const manager = runtime.getManager();

  const value = useMemo(
    () => ({
      runtime,
      manager,
      state: manager.getState(),
      monitorReport,
      shutdownReport,
      isStarting,
      isRunning: manager.isRunning(),
    }),
    [isStarting, manager, monitorReport, runtime, shutdownReport, version],
  );

  return <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>;
}
