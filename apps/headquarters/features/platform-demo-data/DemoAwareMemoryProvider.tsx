"use client";

import type { ReactNode } from "react";
import { MemoryProvider, type MemoryProviderProps } from "@douglas/memory";
import { useDemoMockData } from "./useDemoMockData";

interface DemoAwareMemoryProviderProps extends MemoryProviderProps {
  children: ReactNode;
}

export function DemoAwareMemoryProvider({
  children,
  seedRecords,
  ...props
}: DemoAwareMemoryProviderProps) {
  const gatedSeedRecords = useDemoMockData("memory_mocks", seedRecords ?? []);

  return (
    <MemoryProvider {...props} seedRecords={[...gatedSeedRecords]}>
      {children}
    </MemoryProvider>
  );
}
