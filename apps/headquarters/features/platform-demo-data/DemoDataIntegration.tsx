"use client";

import { DemoDataProvider } from "@douglas/demo-data";
import type { ReactNode } from "react";
import { demoDataConfig } from "@/features/platform-demo-data/config";

interface DemoDataIntegrationProps {
  children: ReactNode;
}

export function DemoDataIntegration({ children }: DemoDataIntegrationProps) {
  return <DemoDataProvider config={demoDataConfig}>{children}</DemoDataProvider>;
}
