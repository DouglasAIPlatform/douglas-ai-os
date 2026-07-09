"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import type { DemoDataConfig } from "./DemoDataConfig";
import { DEFAULT_DEMO_DATA_CONFIG } from "./DemoDataConfig";
import { DemoDataContext } from "./DemoDataContext";
import { isDemoSourceEnabled, resolveDemoDataPolicy } from "./resolveDemoDataPolicy";
import type { DemoDataSource } from "./DemoDataSource";

export interface DemoDataProviderProps {
  children: ReactNode;
  config?: DemoDataConfig;
}

export function DemoDataProvider({
  children,
  config = DEFAULT_DEMO_DATA_CONFIG,
}: DemoDataProviderProps) {
  const policy = useMemo(() => resolveDemoDataPolicy(config), [config]);

  const isSourceEnabled = useCallback(
    (source: DemoDataSource) => isDemoSourceEnabled(policy, source),
    [policy],
  );

  const value = useMemo(
    () => ({
      config,
      policy,
      isSourceEnabled,
    }),
    [config, policy, isSourceEnabled],
  );

  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>;
}
