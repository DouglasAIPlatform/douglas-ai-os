"use client";

import {
  DEMO_DATA_UNCONNECTED_DESCRIPTION,
  DEMO_DATA_UNCONNECTED_TITLE,
  useDemoData,
} from "@douglas/demo-data";
import { Card, ContentLayout } from "@douglas/ui";
import { RecentSearches } from "./RecentSearches";
import { SearchInput } from "./SearchInput";
import { SearchResults } from "./SearchResults";

export function SearchPanel() {
  const { isSourceEnabled } = useDemoData();
  const widgetMocksEnabled = isSourceEnabled("widget_mocks");

  return (
    <ContentLayout>
      <Card>
        <div className="space-y-[var(--ds-space-4)]">
          <div>
            <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
              Search Engine Interno
            </p>
            <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)]">
              {widgetMocksEnabled
                ? "Infraestrutura mockada para projetos, departamentos, agentes, configurações, usuários e documentação."
                : "Índice limitado a rotas, configurações e documentação — dados demo desligados."}
            </p>
          </div>

          {!widgetMocksEnabled ? (
            <div className="rounded-[var(--ds-radius-md)] border border-dashed border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
              <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
                {DEMO_DATA_UNCONNECTED_TITLE}
              </p>
              <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)]">
                {DEMO_DATA_UNCONNECTED_DESCRIPTION}
              </p>
            </div>
          ) : null}

          <SearchInput />
          <SearchResults />
        </div>
      </Card>

      <Card>
        <RecentSearches />
      </Card>
    </ContentLayout>
  );
}
