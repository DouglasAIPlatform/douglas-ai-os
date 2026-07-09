import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export interface NavigationItemData {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: string;
  disabled?: boolean;
}

export interface NavigationSectionData {
  id: string;
  label?: string;
  items: NavigationItemData[];
}

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  title: string;
  subtitle?: string;
  navigationSections: NavigationSectionData[];
  activeHref?: string;
  footer?: ReactNode;
  tabletCollapsed?: boolean;
  mobileOpen?: boolean;
  onToggleTabletCollapsed?: () => void;
  onOpenMobile?: () => void;
  onCloseMobile?: () => void;
}

export interface SidebarHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  collapsed?: boolean;
}

export interface SidebarGroupProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  collapsed?: boolean;
}

export interface SidebarItemProps
  extends AnchorHTMLAttributes<HTMLAnchorElement> {
  item: NavigationItemData;
  active?: boolean;
  collapsed?: boolean;
}

export interface SidebarFooterProps extends HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean;
}

export interface NavigationSectionProps {
  section: NavigationSectionData;
  activeHref?: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}

function MenuIcon() {
  return (
    <svg
      aria-hidden
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7h16M4 12h16M4 17h16"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18 18 6M6 6l12 12"
      />
    </svg>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      aria-hidden
      className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m15 18-6-6 6-6"
      />
    </svg>
  );
}

function BrandMark() {
  return (
    <span className="flex h-[var(--ds-space-10)] w-[var(--ds-space-10)] shrink-0 items-center justify-center rounded-[var(--ds-radius-md)] bg-[image:var(--ds-gradient-brand)] text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-bold)] tracking-[var(--ds-letter-spacing-tight)] text-[var(--ds-color-text-inverse)] shadow-[var(--ds-elevation-md)]">
      D
    </span>
  );
}

export function SidebarHeader({
  title,
  subtitle,
  collapsed = false,
  className,
  ...props
}: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-[var(--ds-space-3)] border-b border-[var(--ds-color-border-subtle)] px-[var(--ds-space-4)] py-[var(--ds-space-4)]",
        collapsed &&
          "justify-center px-[var(--ds-space-3)] lg:justify-start lg:px-[var(--ds-space-4)]",
        className,
      )}
      {...props}
    >
      <BrandMark />
      <div className={cn("min-w-0", collapsed && "hidden lg:block")}>
        <p className="truncate text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] tracking-[var(--ds-letter-spacing-tight)] text-[var(--ds-color-text-primary)]">
          {title}
        </p>
        {subtitle ? (
            <p className="mt-[var(--ds-space-0-5)] truncate text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function SidebarGroup({
  label,
  collapsed = false,
  className,
  children,
  ...props
}: SidebarGroupProps) {
  return (
    <div className={cn("space-y-[var(--ds-space-1-5)]", className)} {...props}>
      {label ? (
        <p
          className={cn(
            "px-[var(--ds-space-3)] text-[length:var(--ds-font-size-2xs)] font-[var(--ds-font-weight-semibold)] uppercase tracking-[var(--ds-letter-spacing-label)] text-[var(--ds-color-text-subtle)]",
            collapsed && "hidden lg:block",
          )}
        >
          {label}
        </p>
      ) : null}
      <div className="space-y-[var(--ds-space-1)]">{children}</div>
    </div>
  );
}

export function SidebarItem({
  item,
  active = false,
  collapsed = false,
  className,
  onClick,
  ...props
}: SidebarItemProps) {
  return (
    <a
      aria-current={active ? "page" : undefined}
      aria-disabled={item.disabled}
      className={cn(
        "group relative flex h-[var(--ds-space-10)] items-center gap-[var(--ds-space-3)] rounded-[var(--ds-radius-md)] px-[var(--ds-space-3)] text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-muted)] outline-none transition-all duration-[var(--ds-duration-normal)] ease-[var(--ds-ease-standard)] hover:bg-[var(--ds-state-overlay-hover)] hover:text-[var(--ds-color-text-primary)] focus-visible:shadow-[var(--ds-shadow-focus)]",
        active &&
          "bg-[var(--ds-state-overlay-selected)] text-[var(--ds-color-text-inverse)] shadow-[var(--ds-elevation-xs)] hover:bg-[var(--ds-state-overlay-selected)] hover:text-[var(--ds-color-text-inverse)]",
        item.disabled &&
          "pointer-events-none opacity-[var(--ds-state-disabled-opacity)]",
        collapsed &&
          "justify-center px-[var(--ds-space-0)] lg:justify-start lg:px-[var(--ds-space-3)]",
        className,
      )}
      href={item.href}
      title={collapsed ? item.label : undefined}
      onClick={onClick}
      {...props}
    >
      {item.icon ? (
        <span
          className={cn(
            "flex h-[var(--ds-space-4)] w-[var(--ds-space-4)] shrink-0 items-center justify-center text-[var(--ds-color-text-subtle)] transition-colors duration-[var(--ds-duration-normal)] group-hover:text-inherit",
            active && "text-inherit",
          )}
        >
          {item.icon}
        </span>
      ) : null}
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          collapsed && "hidden lg:block",
        )}
      >
        {item.label}
      </span>
      {item.badge ? (
        <span
          className={cn(
            "rounded-[var(--ds-radius-full)] px-[var(--ds-space-2)] py-[var(--ds-space-0-5)] text-[length:var(--ds-font-size-2xs)] font-[var(--ds-font-weight-medium)] tabular-nums",
            active
              ? "bg-[var(--ds-color-border-inverse)] text-[var(--ds-color-text-inverse)]"
              : "bg-[var(--ds-state-overlay-hover)] text-[var(--ds-color-text-muted)]",
            collapsed && "hidden lg:inline-flex",
          )}
        >
          {item.badge}
        </span>
      ) : null}
    </a>
  );
}

export function NavigationSection({
  section,
  activeHref,
  collapsed = false,
  onNavigate,
}: NavigationSectionProps) {
  return (
    <SidebarGroup label={section.label} collapsed={collapsed}>
      {section.items.map((item) => (
        <SidebarItem
          key={item.id}
          item={item}
          active={item.href === activeHref}
          collapsed={collapsed}
          onClick={onNavigate}
        />
      ))}
    </SidebarGroup>
  );
}

export function SidebarFooter({
  collapsed = false,
  className,
  children,
  ...props
}: SidebarFooterProps) {
  return (
    <div
      className={cn(
        "border-t border-[var(--ds-color-border-subtle)] px-[var(--ds-space-4)] py-[var(--ds-space-4)]",
        collapsed && "px-[var(--ds-space-3)]",
        className,
      )}
      {...props}
    >
      <div className={cn(collapsed && "hidden lg:block")}>{children}</div>
    </div>
  );
}

function SidebarContent({
  title,
  subtitle,
  navigationSections,
  activeHref,
  footer,
  collapsed,
  onNavigate,
}: SidebarProps & { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <>
      <SidebarHeader title={title} subtitle={subtitle} collapsed={collapsed} />
      <nav
        aria-label="Main navigation"
        className="flex-1 space-y-[var(--ds-space-6)] overflow-y-auto px-[var(--ds-space-3)] py-[var(--ds-space-4)]"
      >
        {navigationSections.map((section) => (
          <NavigationSection
            key={section.id}
            section={section}
            activeHref={activeHref}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
      {footer ? (
        <SidebarFooter collapsed={collapsed}>{footer}</SidebarFooter>
      ) : null}
    </>
  );
}

export function Sidebar({
  title,
  subtitle,
  navigationSections,
  activeHref,
  footer,
  tabletCollapsed = true,
  mobileOpen = false,
  onToggleTabletCollapsed,
  onOpenMobile,
  onCloseMobile,
  className,
  ...props
}: SidebarProps) {
  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-canvas)]/85 px-[var(--ds-space-4)] py-[var(--ds-space-3)] backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-[var(--ds-space-3)]">
          <BrandMark />
          <div>
            <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] tracking-[var(--ds-letter-spacing-tight)] text-[var(--ds-color-text-primary)]">
              {title}
            </p>
            {subtitle ? (
              <p className="text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        <button
          aria-label="Abrir navegação"
          className="inline-flex h-[var(--ds-space-10)] w-[var(--ds-space-10)] items-center justify-center rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] text-[var(--ds-color-text-secondary)] shadow-[var(--ds-elevation-xs)] transition-colors duration-[var(--ds-duration-normal)] hover:bg-[var(--ds-color-surface-muted)] focus-visible:outline-none focus-visible:shadow-[var(--ds-shadow-focus)]"
          type="button"
          onClick={onOpenMobile}
        >
          <MenuIcon />
        </button>
      </div>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-glass)] shadow-[var(--ds-elevation-ring-inset)] backdrop-blur-xl transition-[width] duration-[var(--ds-duration-slow)] ease-[var(--ds-ease-standard)] md:flex",
          tabletCollapsed
            ? "w-[var(--ds-sidebar-width-collapsed)]"
            : "w-[var(--ds-sidebar-width-expanded)]",
          "lg:w-[var(--ds-sidebar-width-expanded)]",
          className,
        )}
        {...props}
      >
        <SidebarContent
          title={title}
          subtitle={subtitle}
          navigationSections={navigationSections}
          activeHref={activeHref}
          footer={footer}
          collapsed={tabletCollapsed}
        />
        <button
          aria-label={
            tabletCollapsed ? "Expandir navegação" : "Recolher navegação"
          }
          className="absolute -right-[var(--ds-space-3)] top-[var(--ds-sidebar-width-collapsed)] hidden h-[var(--ds-space-6)] w-[var(--ds-space-6)] items-center justify-center rounded-[var(--ds-radius-full)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] text-[var(--ds-color-text-muted)] shadow-[var(--ds-elevation-xs)] transition-colors duration-[var(--ds-duration-normal)] hover:text-[var(--ds-color-text-primary)] focus-visible:outline-none focus-visible:shadow-[var(--ds-shadow-focus)] md:flex lg:hidden"
          type="button"
          onClick={onToggleTabletCollapsed}
        >
          <CollapseIcon collapsed={tabletCollapsed} />
        </button>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Fechar navegação"
            className="absolute inset-0 bg-[var(--ds-color-overlay)] backdrop-blur-sm"
            type="button"
            onClick={onCloseMobile}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(20rem,calc(100vw-var(--ds-space-8)))] flex-col border-r border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] shadow-[var(--ds-elevation-lg)]">
            <button
              aria-label="Fechar navegação"
              className="absolute right-[var(--ds-space-4)] top-[var(--ds-space-4)] inline-flex h-[var(--ds-space-8)] w-[var(--ds-space-8)] items-center justify-center rounded-[var(--ds-radius-sm)] text-[var(--ds-color-text-muted)] transition-colors duration-[var(--ds-duration-normal)] hover:bg-[var(--ds-state-overlay-hover)] hover:text-[var(--ds-color-text-primary)] focus-visible:outline-none focus-visible:shadow-[var(--ds-shadow-focus)]"
              type="button"
              onClick={onCloseMobile}
            >
              <CloseIcon />
            </button>
            <SidebarContent
              title={title}
              subtitle={subtitle}
              navigationSections={navigationSections}
              activeHref={activeHref}
              footer={footer}
              collapsed={false}
              onNavigate={onCloseMobile}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}
