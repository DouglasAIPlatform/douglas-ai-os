import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export interface CommandPaletteItemData {
  id: string;
  title: string;
  subtitle?: string;
  keywords?: string[];
  shortcut?: string[];
  icon?: ReactNode;
  disabled?: boolean;
}

export interface CommandPaletteGroupData {
  id: string;
  label: string;
  items: CommandPaletteItemData[];
}

export interface CommandPaletteProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  title?: string;
  description?: string;
  query?: string;
  placeholder?: string;
  groups: CommandPaletteGroupData[];
  emptyLabel?: string;
  footer?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  onQueryChange?: (query: string) => void;
  onSelectItem?: (item: CommandPaletteItemData) => void;
}

export interface CommandPaletteInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onValueChange?: (value: string) => void;
}

export interface CommandPaletteGroupProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
}

export interface CommandPaletteItemProps extends HTMLAttributes<HTMLButtonElement> {
  item: CommandPaletteItemData;
  onItemSelect?: (item: CommandPaletteItemData) => void;
}

function SearchIcon() {
  return (
    <svg
      aria-hidden
      className="h-[var(--ds-space-4)] w-[var(--ds-space-4)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-4.35-4.35M10.875 18.75a7.875 7.875 0 1 1 0-15.75 7.875 7.875 0 0 1 0 15.75Z"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden
      className="h-[var(--ds-space-4)] w-[var(--ds-space-4)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

export function CommandPaletteInput({
  value,
  onValueChange,
  className,
  placeholder = "Pesquisar comandos, páginas, agentes e projetos...",
  ...props
}: CommandPaletteInputProps) {
  return (
    <div className="flex items-center gap-[var(--ds-space-3)] border-b border-[var(--ds-color-border-subtle)] px-[var(--ds-space-4)] py-[var(--ds-space-3)]">
      <span className="text-[var(--ds-color-text-subtle)]">
        <SearchIcon />
      </span>
      <input
        className={cn(
          "min-w-0 flex-1 bg-transparent text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-primary)] outline-none placeholder:text-[var(--ds-color-text-subtle)]",
          className,
        )}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onValueChange?.(event.target.value)}
        {...props}
      />
    </div>
  );
}

export function CommandPaletteGroup({
  label,
  className,
  children,
  ...props
}: CommandPaletteGroupProps) {
  return (
    <section className={cn("space-y-[var(--ds-space-1)]", className)} {...props}>
      <p className="px-[var(--ds-space-2)] text-[length:var(--ds-font-size-2xs)] font-[var(--ds-font-weight-semibold)] uppercase tracking-[var(--ds-letter-spacing-label)] text-[var(--ds-color-text-subtle)]">
        {label}
      </p>
      <div className="space-y-[var(--ds-space-1)]">{children}</div>
    </section>
  );
}

export function CommandPaletteItem({
  item,
  onItemSelect,
  className,
  ...props
}: CommandPaletteItemProps) {
  return (
    <button
      className={cn(
        "group flex w-full items-center gap-[var(--ds-space-3)] rounded-[var(--ds-radius-md)] px-[var(--ds-space-3)] py-[var(--ds-space-2-5)] text-left outline-none transition-colors duration-[var(--ds-duration-normal)] hover:bg-[var(--ds-state-overlay-hover)] focus-visible:shadow-[var(--ds-shadow-focus)] disabled:pointer-events-none disabled:opacity-[var(--ds-state-disabled-opacity)]",
        className,
      )}
      type="button"
      disabled={item.disabled}
      onClick={() => onItemSelect?.(item)}
      {...props}
    >
      {item.icon ? (
        <span className="flex h-[var(--ds-space-8)] w-[var(--ds-space-8)] shrink-0 items-center justify-center rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-subtle)] bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-text-muted)]">
          {item.icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
          {item.title}
        </span>
        {item.subtitle ? (
          <span className="mt-[var(--ds-space-0-5)] block truncate text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
            {item.subtitle}
          </span>
        ) : null}
      </span>
      {item.shortcut?.length ? (
        <span className="hidden shrink-0 items-center gap-[var(--ds-space-1)] sm:flex">
          {item.shortcut.map((key) => (
            <kbd
              key={key}
              className="rounded-[var(--ds-radius-xs)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] px-[var(--ds-space-1-5)] py-[var(--ds-space-0-5)] text-[length:var(--ds-font-size-2xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-muted)]"
            >
              {key}
            </kbd>
          ))}
        </span>
      ) : null}
    </button>
  );
}

export function CommandPaletteEmpty({ label }: { label: string }) {
  return (
    <div className="px-[var(--ds-space-4)] py-[var(--ds-space-8)] text-center">
      <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-primary)]">
        Nenhum resultado encontrado
      </p>
      <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-sm)] text-[var(--ds-color-text-muted)]">
        {label}
      </p>
    </div>
  );
}

export function CommandPalette({
  open,
  title = "Douglas Command Palette",
  description = "Infraestrutura preparada para comandos, páginas, agentes e IA.",
  query = "",
  placeholder,
  groups,
  emptyLabel = "Tente pesquisar por uma página, agente, projeto ou comando.",
  footer,
  onOpenChange,
  onQueryChange,
  onSelectItem,
  className,
  ...props
}: CommandPaletteProps) {
  if (!open) return null;

  const hasResults = groups.some((group) => group.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[var(--ds-color-overlay)] px-[var(--ds-space-4)] py-[var(--ds-space-16)] backdrop-blur-sm">
      <button
        aria-label="Fechar Command Palette"
        className="absolute inset-0"
        type="button"
        onClick={() => onOpenChange?.(false)}
      />
      <div
        aria-modal="true"
        role="dialog"
        className={cn(
          "relative flex max-h-[min(42rem,calc(100vh-var(--ds-space-16)))] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--ds-radius-panel)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface)] shadow-[var(--ds-elevation-lg)]",
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-[var(--ds-space-4)] px-[var(--ds-space-4)] py-[var(--ds-space-4)]">
          <div>
            <p className="text-[length:var(--ds-font-size-sm)] font-[var(--ds-font-weight-semibold)] text-[var(--ds-color-text-primary)]">
              {title}
            </p>
            <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-font-size-xs)] text-[var(--ds-color-text-muted)]">
              {description}
            </p>
          </div>
          <button
            aria-label="Fechar"
            className="inline-flex h-[var(--ds-space-8)] w-[var(--ds-space-8)] items-center justify-center rounded-[var(--ds-radius-sm)] text-[var(--ds-color-text-muted)] transition-colors hover:bg-[var(--ds-state-overlay-hover)] hover:text-[var(--ds-color-text-primary)] focus-visible:outline-none focus-visible:shadow-[var(--ds-shadow-focus)]"
            type="button"
            onClick={() => onOpenChange?.(false)}
          >
            <CloseIcon />
          </button>
        </div>

        <CommandPaletteInput
          value={query}
          placeholder={placeholder}
          onValueChange={onQueryChange}
        />

        <div className="min-h-0 flex-1 overflow-y-auto p-[var(--ds-space-3)]">
          {hasResults ? (
            <div className="space-y-[var(--ds-space-5)]">
              {groups.map((group) =>
                group.items.length ? (
                  <CommandPaletteGroup key={group.id} label={group.label}>
                    {group.items.map((item) => (
                      <CommandPaletteItem
                        key={item.id}
                        item={item}
                        onItemSelect={onSelectItem}
                      />
                    ))}
                  </CommandPaletteGroup>
                ) : null,
              )}
            </div>
          ) : (
            <CommandPaletteEmpty label={emptyLabel} />
          )}
        </div>

        {footer ? (
          <div className="border-t border-[var(--ds-color-border-subtle)] px-[var(--ds-space-4)] py-[var(--ds-space-3)]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
