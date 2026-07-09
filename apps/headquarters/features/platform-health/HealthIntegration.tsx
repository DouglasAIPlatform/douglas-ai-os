"use client";

import { usePlatformBootstrap } from "@douglas/bootstrap";
import { useDOS } from "@douglas/dos";
import { HealthProvider } from "@douglas/health";
import { usePlatformRuntime } from "@douglas/runtime";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { createPlatformHealthChecks } from "@/features/platform-health";
import { PlatformOperationalIntegration } from "@/features/platform-state/PlatformOperationalIntegration";

interface HealthIntegrationProps {
  children: ReactNode;
}

export function HealthIntegration({ children }: HealthIntegrationProps) {
  const { isReady: bootstrapReady, state: bootstrapState } = usePlatformBootstrap();
  const { isRunning: runtimeRunning, state: runtimeState } = usePlatformRuntime();
  const dos = useDOS();

  const checks = useMemo(
    () =>
      createPlatformHealthChecks({
        bootstrapReady,
        runtimeRunning,
        platformUptimeMs: runtimeState.uptimeMs,
        findBootstrapModule: (id) =>
          bootstrapState.modules.find((module) => module.id === id),
        findRuntimeModule: (id) =>
          runtimeState.modules.find((module) => module.id === id),
        dos: {
          isReady: dos.isReady,
          health: dos.state.health,
          status: dos.state.status,
          readyModuleCount: dos.state.readyModuleCount,
          moduleCount: dos.state.moduleCount,
        },
      }),
    [
      bootstrapReady,
      bootstrapState.modules,
      dos.isReady,
      dos.state.health,
      dos.state.moduleCount,
      dos.state.readyModuleCount,
      dos.state.status,
      runtimeRunning,
      runtimeState.modules,
      runtimeState.uptimeMs,
    ],
  );

  return (
    <HealthProvider enabled={bootstrapReady && runtimeRunning} checks={checks}>
      <PlatformOperationalIntegration>{children}</PlatformOperationalIntegration>
    </HealthProvider>
  );
}
