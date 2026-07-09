"use client";

import { BootstrapProvider } from "@douglas/bootstrap";
import { CoreProvider } from "@douglas/core";
import { DOSProvider } from "@douglas/dos";
import { EventProvider } from "@douglas/events";
import { AutomationProvider } from "@douglas/automation";
import { WorkflowProvider } from "@douglas/workflow";
import { AgentProvider } from "@douglas/agents";
import { Sidebar, SidebarLayout } from "@douglas/ui";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  getActiveSidebarHref,
  sidebarNavigationSections,
} from "@/config/routes";
import { agentDefinitions } from "@/features/agents/definitions";
import { coreModuleDefinitions } from "@/features/core";
import { corporateEventDefinitions } from "@/features/events";
import { automationDefinitions } from "@/features/automation-engine";
import { BrainProvider } from "@/features/brain/BrainProvider";
import { workflowDefinitions } from "@/features/workflow-engine";
import {
  defaultMemoryBackendId,
  memoryBackends,
  memorySeedRecords,
} from "@/features/memory-engine";
import { CommandPaletteProvider } from "@/features/command-palette/CommandPaletteProvider";
import { CommandPaletteRoot } from "@/features/command-palette/CommandPaletteRoot";
import { SearchProvider } from "@/features/search-engine/SearchProvider";
import { platformBootstrapOptions } from "@/features/platform-bootstrap";
import { dosBootOptions } from "@/features/dos";
import { RuntimeIntegration } from "@/features/platform-runtime/RuntimeIntegration";
import { DemoAwareMemoryProvider, DemoDataIntegration } from "@/features/platform-demo-data";
import { SupabaseIntegration } from "@/features/platform-supabase";
import { EventMonitorIntegration } from "@/features/platform-monitor/EventMonitorIntegration";
import { platformVersion } from "@/lib/mock-data";

interface AppShellProps {
  children: ReactNode;
}

function SidebarProfile() {
  return (
    <div className="flex items-center gap-[var(--ds-space-3)] rounded-[var(--ds-radius-2xl)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-3)]">
      <div className="flex h-[var(--ds-space-10)] w-[var(--ds-space-10)] shrink-0 items-center justify-center rounded-[var(--ds-radius-md)] bg-[image:var(--ds-gradient-violet)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-inverse)]">
        DA
      </div>
      <div className="min-w-0">
        <p className="truncate text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
          Douglas AI
        </p>
        <p className="truncate text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
          Version {platformVersion}
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isTabletCollapsed, setIsTabletCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const activeHref = getActiveSidebarHref(pathname);

  return (
    <BootstrapProvider
      platformVersion={platformVersion}
      modules={platformBootstrapOptions.modules}
    >
    <CoreProvider modules={coreModuleDefinitions} platformVersion={platformVersion}>
      <DOSProvider
        bootOptions={dosBootOptions}
        kernelOptions={{ platformVersion, environment: "development" }}
      >
      <EventProvider definitions={corporateEventDefinitions}>
      <SupabaseIntegration>
      <DemoDataIntegration>
      <EventMonitorIntegration>
      <RuntimeIntegration>
      <SearchProvider>
      <AutomationProvider automations={automationDefinitions}>
        <WorkflowProvider workflows={workflowDefinitions}>
        <DemoAwareMemoryProvider
          backends={memoryBackends}
          seedRecords={memorySeedRecords}
          defaultBackendId={defaultMemoryBackendId}
        >
          <AgentProvider definitions={agentDefinitions}>
            <BrainProvider>
              <CommandPaletteProvider>
        <SidebarLayout
          sidebar={
            <Sidebar
              title="Douglas AI OS"
              subtitle="Operating System"
              navigationSections={sidebarNavigationSections}
              activeHref={activeHref}
              footer={<SidebarProfile />}
              tabletCollapsed={isTabletCollapsed}
              mobileOpen={isMobileOpen}
              onToggleTabletCollapsed={() =>
                setIsTabletCollapsed((currentValue) => !currentValue)
              }
              onOpenMobile={() => setIsMobileOpen(true)}
              onCloseMobile={() => setIsMobileOpen(false)}
            />
          }
        >
          {children}
        </SidebarLayout>
        <CommandPaletteRoot />
              </CommandPaletteProvider>
            </BrainProvider>
          </AgentProvider>
        </DemoAwareMemoryProvider>
        </WorkflowProvider>
      </AutomationProvider>
      </SearchProvider>
      </RuntimeIntegration>
      </EventMonitorIntegration>
      </DemoDataIntegration>
      </SupabaseIntegration>
      </EventProvider>
      </DOSProvider>
    </CoreProvider>
    </BootstrapProvider>
  );
}
