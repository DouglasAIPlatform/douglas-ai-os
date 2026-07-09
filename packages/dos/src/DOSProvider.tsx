"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { DOSContext } from "./DOSContext";
import { OperatingSystem } from "./OperatingSystem";
import type { KernelOptions } from "./Kernel";
import type { BootOptions, BootResult, ShutdownResult } from "./DOSTypes";

export interface DOSProviderProps {
  children: ReactNode;
  bootOptions: BootOptions;
  kernelOptions?: KernelOptions;
  autoBoot?: boolean;
}

export function DOSProvider({
  children,
  bootOptions,
  kernelOptions,
  autoBoot = true,
}: DOSProviderProps) {
  const [os] = useState(() => new OperatingSystem(kernelOptions));
  const [lastBootResult, setLastBootResult] = useState<BootResult | null>(() =>
    autoBoot ? os.boot(bootOptions) : null,
  );
  const [lastShutdownResult, setLastShutdownResult] =
    useState<ShutdownResult | null>(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  const boot = useCallback(() => {
    const result = os.boot(bootOptions);
    setLastBootResult(result);
    setLastShutdownResult(null);
    refresh();
    return result;
  }, [bootOptions, os, refresh]);

  const shutdown = useCallback(() => {
    const result = os.shutdown();
    setLastShutdownResult(result);
    refresh();
    return result;
  }, [os, refresh]);

  const value = useMemo(
    () => ({
      os,
      kernel: os.kernel,
      state: os.getState(),
      health: os.getHealthReport(),
      lastBootResult,
      lastShutdownResult,
      isReady: os.isReady(),
      boot,
      shutdown,
    }),
    [boot, lastBootResult, lastShutdownResult, os, shutdown, version],
  );

  return <DOSContext.Provider value={value}>{children}</DOSContext.Provider>;
}
