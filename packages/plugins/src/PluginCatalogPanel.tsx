"use client";

import { PLUGIN_PRODUCT_LABELS, PLUGIN_STATUS_LABELS } from "./PluginTypes";
import { usePlugins } from "./usePlugins";

interface PluginCatalogPanelProps {
  emptyMessage?: string;
}

export function PluginCatalogPanel({
  emptyMessage = "Nenhum plugin registrado no sistema.",
}: PluginCatalogPanelProps) {
  const { plugins, getRoutes, getMenus, getWidgets, getAgents, getEvents, getPermissions } =
    usePlugins();

  if (!plugins.length) {
    return (
      <div className="rounded-[var(--ds-radius-md)] border border-dashed border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
        <p className="text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)]">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-[var(--ds-space-6)]">
      <div>
        <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
          Plugin System
        </p>
        <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)]">
          {plugins.length} produto(s) registrado(s) — arquitetura mockada.
        </p>
      </div>

      {plugins.map((plugin) => {
        const routes = getRoutes(plugin.id);
        const menus = getMenus(plugin.id);
        const widgets = getWidgets(plugin.id);
        const agents = getAgents(plugin.id);
        const events = getEvents(plugin.id);
        const permissions = getPermissions(plugin.id);

        return (
          <article
            key={plugin.id}
            className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]"
          >
            <div className="flex flex-col gap-[var(--ds-space-1)] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
                  {PLUGIN_PRODUCT_LABELS[plugin.id] ?? plugin.name}
                </p>
                <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                  {plugin.manifest.description}
                </p>
              </div>
              <span className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-subtle)]">
                v{plugin.version} · {PLUGIN_STATUS_LABELS[plugin.status]}
              </span>
            </div>

            <div className="mt-[var(--ds-space-4)] grid gap-[var(--ds-space-4)] lg:grid-cols-2">
              <RegistrationGroup
                title="Rotas"
                items={routes.map((entry) => `${entry.route.label} (${entry.route.path})`)}
              />
              <RegistrationGroup
                title="Menus"
                items={menus.map((entry) => `${entry.menu.label} → ${entry.menu.routeId}`)}
              />
              <RegistrationGroup
                title="Widgets"
                items={widgets.map(
                  (entry) => `${entry.widget.name} [${entry.widget.slot}]`,
                )}
              />
              <RegistrationGroup
                title="Agentes"
                items={agents.map((entry) => entry.agent.name)}
              />
              <RegistrationGroup
                title="Eventos"
                items={events.map((entry) => entry.event.topic)}
              />
              <RegistrationGroup
                title="Permissões"
                items={permissions.map((entry) => entry.permission.id)}
              />
            </div>
          </article>
        );
      })}
    </section>
  );
}

function RegistrationGroup({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>
      <p className="text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] uppercase tracking-[var(--ds-letter-spacing-wide)] text-[var(--ds-color-text-muted)]">
        {title}
      </p>
      {items.length ? (
        <ul className="mt-[var(--ds-space-2)] space-y-[var(--ds-space-1)]">
          {items.map((item) => (
            <li
              key={item}
              className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-primary)]"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-subtle)]">
          —
        </p>
      )}
    </div>
  );
}
