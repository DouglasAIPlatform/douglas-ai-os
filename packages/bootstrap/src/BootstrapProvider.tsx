"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { BootstrapManager } from "./BootstrapManager";
import { PlatformBootstrap } from "./PlatformBootstrap";
import { PlatformBootstrapContext } from "./PlatformBootstrapContext";
import type { BootstrapModuleDefinition, StartupReport } from "./BootstrapTypes";

export interface BootstrapProviderProps {
  children: ReactNode;
  platformVersion: string;
  modules: BootstrapModuleDefinition[];
  bootstrap?: PlatformBootstrap;
}

export function BootstrapProvider({
  children,
  platformVersion,
  modules,
  bootstrap: externalBootstrap,
}: BootstrapProviderProps) {
  const [bootstrap] = useState(
    () => externalBootstrap ?? new PlatformBootstrap(),
  );
  const [startupReport, setStartupReport] = useState<StartupReport | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;

    setIsBooting(true);
    bootstrap
      .boot({ platformVersion, modules })
      .then((report) => {
        if (!active) return;
        setStartupReport(report);
        setIsBooting(false);
        setVersion((current) => current + 1);
      })
      .catch(() => {
        if (!active) return;
        setIsBooting(false);
        setVersion((current) => current + 1);
      });

    return () => {
      active = false;
    };
  }, [bootstrap, modules, platformVersion]);

  const manager = bootstrap.getManager() as BootstrapManager;

  const value = useMemo(
    () => ({
      bootstrap,
      manager,
      state: manager.getState(),
      health: manager.getHealth(),
      startupReport,
      isBooting,
      isReady: manager.isReady(),
    }),
    [bootstrap, isBooting, manager, startupReport, version],
  );

  return (
    <PlatformBootstrapContext.Provider value={value}>
      {children}
    </PlatformBootstrapContext.Provider>
  );
}
