"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { PlatformStateContext } from "./PlatformStateContext";
import type { PlatformSnapshot } from "./PlatformStateTypes";
import { createPlatformStateFacade, type PlatformStateFacade } from "./PlatformStateFacade";

export interface PlatformStateProviderProps {
  children: ReactNode;
  snapshot: PlatformSnapshot;
  facade?: PlatformStateFacade;
}

export function PlatformStateProvider({
  children,
  snapshot,
  facade: externalFacade,
}: PlatformStateProviderProps) {
  const facade = useMemo(
    () => externalFacade ?? createPlatformStateFacade(),
    [externalFacade],
  );

  const value = useMemo(
    () => ({
      facade,
      snapshot,
    }),
    [facade, snapshot],
  );

  return (
    <PlatformStateContext.Provider value={value}>{children}</PlatformStateContext.Provider>
  );
}
