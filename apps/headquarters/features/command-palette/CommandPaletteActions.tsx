"use client";

import { cn } from "@douglas/ui";
import { useCommandPalette } from "./useCommandPalette";

const actionClassName =
  "inline-flex h-[var(--ds-space-10)] items-center gap-[var(--ds-space-2)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border-default)] bg-[var(--ds-color-surface-glass)] px-[var(--ds-space-3)] text-[length:var(--ds-font-size-xs)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-text-muted)] shadow-[var(--ds-elevation-xs)] backdrop-blur-sm transition-colors duration-[var(--ds-duration-normal)] ease-[var(--ds-ease-standard)] hover:bg-[var(--ds-color-surface)] hover:text-[var(--ds-color-text-primary)] focus-visible:outline-none focus-visible:shadow-[var(--ds-shadow-focus)]";

function SearchIcon() {
  return (
    <svg
      aria-hidden
      className="h-[var(--ds-space-3-5)] w-[var(--ds-space-3-5)]"
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

function CommandIcon() {
  return (
    <svg
      aria-hidden
      className="h-[var(--ds-space-3-5)] w-[var(--ds-space-3-5)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 6.75A3.75 3.75 0 1 0 5.25 10.5H9V6.75Zm0 0A3.75 3.75 0 1 1 12.75 10.5H9V6.75Zm0 10.5A3.75 3.75 0 1 1 5.25 13.5H9v3.75Zm0 0A3.75 3.75 0 1 0 12.75 13.5H9v3.75Z"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      aria-hidden
      className="h-[var(--ds-space-3-5)] w-[var(--ds-space-3-5)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022 23.848 23.848 0 0 0 5.455 1.31m5.714 0a3 3 0 0 1-5.714 0"
      />
    </svg>
  );
}

export function CommandPaletteActions() {
  const { open } = useCommandPalette();

  return (
    <>
      <button
        aria-label="Abrir pesquisa global"
        className={actionClassName}
        type="button"
        onClick={open}
      >
        <SearchIcon />
        <span className="hidden sm:inline">Pesquisar</span>
      </button>
      <button
        aria-label="Abrir Command Palette"
        className={actionClassName}
        type="button"
        onClick={open}
      >
        <CommandIcon />
        <span className="hidden sm:inline">Command</span>
      </button>
      <button
        aria-label="Notificações preparadas"
        className={cn(
          actionClassName,
          "w-[var(--ds-space-10)] px-[var(--ds-space-0)]",
        )}
        type="button"
        disabled
      >
        <BellIcon />
      </button>
    </>
  );
}
